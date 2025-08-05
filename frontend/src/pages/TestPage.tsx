export function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Тест стилей</h1>
        <p className="text-gray-600">Если вы видите синий фон и белую карточку - стили работают</p>
        <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Тестовая кнопка
        </button>
      </div>
    </div>
  );
}