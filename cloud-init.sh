#!/bin/sh
# GramChat Server Initial Setup Script for Timeweb Cloud
# This script will be executed on first boot via cloud-init

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a /var/log/gramchat-setup.log
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a /var/log/gramchat-setup.log
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a /var/log/gramchat-setup.log
}

# Start setup
log "Starting GramChat server initial setup..."

# Update system
log "Updating system packages..."
apt-get update -y || error "Failed to update package list"
apt-get upgrade -y || error "Failed to upgrade packages"

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    net-tools \
    unzip \
    jq || error "Failed to install essential packages"

# Install Docker
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || error "Failed to install Docker"
    systemctl enable docker
    systemctl start docker
    log "Docker installed successfully"
else
    log "Docker already installed"
fi

# Install Node.js 20 LTS
log "Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs || error "Failed to install Node.js"
    log "Node.js $(node -v) installed successfully"
else
    log "Node.js already installed: $(node -v)"
fi

# Install PM2 for process management
log "Installing PM2..."
npm install -g pm2 || error "Failed to install PM2"
pm2 startup systemd -u root --hp /root
log "PM2 installed successfully"

# Install Nginx
log "Installing Nginx..."
apt-get install -y nginx || error "Failed to install Nginx"
systemctl enable nginx
systemctl start nginx
log "Nginx installed successfully"

# Install Certbot for SSL
log "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx || error "Failed to install Certbot"
log "Certbot installed successfully"

# Configure firewall
log "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # Backend API
ufw reload
log "Firewall configured"

# Configure fail2ban
log "Configuring fail2ban..."
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban
log "Fail2ban configured"

# Create application directory
log "Creating application directory..."
mkdir -p /opt/gramchat
mkdir -p /opt/gramchat/backend
mkdir -p /opt/gramchat/frontend
mkdir -p /opt/gramchat/uploads
mkdir -p /opt/gramchat/logs
mkdir -p /opt/gramchat/backups
chmod -R 755 /opt/gramchat
log "Application directories created"

# Create docker network
log "Creating Docker network..."
docker network create gramchat-network 2>/dev/null || log "Docker network already exists"

# Create swap file (4GB)
log "Creating swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    log "4GB swap file created"
else
    log "Swap file already exists"
fi

# Optimize system settings
log "Optimizing system settings..."
cat > /etc/sysctl.d/99-gramchat.conf << EOF
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30

# File system optimizations
fs.file-max = 100000
fs.inotify.max_user_watches = 524288

# Memory optimizations
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
sysctl -p /etc/sysctl.d/99-gramchat.conf
log "System settings optimized"

# Create deployment script
log "Creating deployment helper script..."
cat > /opt/gramchat/deploy.sh << 'EOF'
#!/bin/bash
# GramChat deployment helper script

set -euo pipefail

ACTION=$1

case $ACTION in
    "setup-ssl")
        DOMAIN=$2
        EMAIL=$3
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
        ;;
    "backup-db")
        docker exec gramchat-postgres pg_dump -U gramchat gramchat_db > /opt/gramchat/backups/db_$(date +%Y%m%d_%H%M%S).sql
        ;;
    "restore-db")
        BACKUP_FILE=$2
        docker exec -i gramchat-postgres psql -U gramchat gramchat_db < $BACKUP_FILE
        ;;
    "logs")
        docker-compose -f /opt/gramchat/docker-compose.yml logs -f --tail=100
        ;;
    "restart")
        cd /opt/gramchat && docker-compose restart
        ;;
    *)
        echo "Usage: $0 {setup-ssl|backup-db|restore-db|logs|restart}"
        exit 1
        ;;
esac
EOF
chmod +x /opt/gramchat/deploy.sh
log "Deployment helper script created"

# Create monitoring script
log "Creating monitoring script..."
cat > /opt/gramchat/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script

WEBHOOK_URL=${MONITORING_WEBHOOK_URL:-""}

check_service() {
    SERVICE=$1
    if ! systemctl is-active --quiet $SERVICE; then
        echo "Service $SERVICE is down!"
        if [ ! -z "$WEBHOOK_URL" ]; then
            curl -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d "{\"text\":\"Alert: $SERVICE is down on $(hostname)\"}"
        fi
    fi
}

# Check services
check_service nginx
check_service docker

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is high: $DISK_USAGE%"
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "Memory usage is high: $MEM_USAGE%"
fi
EOF
chmod +x /opt/gramchat/monitor.sh

# Add monitoring to cron
echo "*/5 * * * * /opt/gramchat/monitor.sh >> /opt/gramchat/logs/monitor.log 2>&1" | crontab -

# Create environment template
log "Creating environment template..."
cat > /opt/gramchat/.env.template << 'EOF'
# GramChat Production Environment Variables
# Copy this file to backend/.env and fill in your values

# Application
NODE_ENV=production
PORT=3000

# Database (use Timeweb Managed PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis (use Timeweb Managed Redis)
REDIS_URL=redis://host:port

# Security - GENERATE NEW KEYS!
JWT_SECRET=CHANGE_ME_$(openssl rand -hex 32)
SESSION_SECRET=CHANGE_ME_$(openssl rand -hex 32)

# CORS and URLs
CORS_ORIGIN=https://your-domain.ru
FRONTEND_URL=https://your-domain.ru

# Telegram
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.ru
TELEGRAM_AUTH_BOT_TOKEN=your_bot_token
TELEGRAM_AUTH_BOT_USERNAME=your_bot_username

# Admin
FIRST_ADMIN_TELEGRAM_ID=your_telegram_id

# Email (optional)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
EMAIL_FROM_NAME=
EOF
log "Environment template created"

# Create README
log "Creating setup README..."
cat > /opt/gramchat/README.md << 'EOF'
# GramChat Server Setup Complete!

## Next Steps:

1. **Clone your repository:**
   ```bash
   cd /opt/gramchat
   git clone https://github.com/your-username/gramchat.git .
   ```

2. **Configure environment:**
   ```bash
   cp .env.template backend/.env
   nano backend/.env  # Edit with your values
   ```

3. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

5. **Setup SSL certificate:**
   ```bash
   /opt/gramchat/deploy.sh setup-ssl your-domain.ru your-email@example.com
   ```

## Useful Commands:

- View logs: `/opt/gramchat/deploy.sh logs`
- Backup database: `/opt/gramchat/deploy.sh backup-db`
- Restart services: `/opt/gramchat/deploy.sh restart`
- Monitor resources: `htop`
- Check services: `docker-compose ps`

## Important Paths:

- Application: `/opt/gramchat`
- Logs: `/opt/gramchat/logs`
- Backups: `/opt/gramchat/backups`
- Uploads: `/opt/gramchat/uploads`

## Security Notes:

1. Change all default passwords and secrets
2. Configure proper domain and SSL
3. Review firewall rules: `ufw status`
4. Check fail2ban: `fail2ban-client status`

## Support:

For issues, check:
- Application logs: `docker-compose logs -f`
- System logs: `journalctl -f`
- Nginx logs: `/var/log/nginx/`
EOF
log "README created at /opt/gramchat/README.md"

# Final setup
log "Performing final setup..."

# Set up log rotation
cat > /etc/logrotate.d/gramchat << EOF
/opt/gramchat/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker-compose -f /opt/gramchat/docker-compose.yml kill -s USR1 backend frontend
    endscript
}
EOF

# Create systemd service for auto-start
cat > /etc/systemd/system/gramchat.service << EOF
[Unit]
Description=GramChat Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/gramchat
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gramchat.service

# Success message
log "================================================"
log "GramChat server initial setup completed!"
log "================================================"
log "System is ready for application deployment."
log "Check /opt/gramchat/README.md for next steps."
log "Setup log saved to: /var/log/gramchat-setup.log"
log "================================================"

# Reboot notification
warn "Server will reboot in 30 seconds to apply all changes..."
warn "After reboot, connect via SSH and continue with deployment."
sleep 30
reboot