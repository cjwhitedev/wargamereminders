import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="App prose lg:prose-xl container mx-auto mt-4 bg-white p-8 rounded-lg shadow-md">
      <h1 className="">Wargame Reminders</h1>
      <p>
        This project use React, Tailwind, and several of it's Official Plugins.
      </p>

      <div className="mt-8 max-w-md">
        <div className="grid grid-cols-1 gap-6">
          <label className="block">
            <span className="text-gray-700">Full name</span>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder=""
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Email address</span>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="john@example.com"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;
