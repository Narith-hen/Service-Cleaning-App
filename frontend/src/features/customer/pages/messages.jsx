import { useNavigate } from 'react-router-dom';

const MessagesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center p-6 font-sans">
      <main className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden text-sm">
        <header className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
            <i className="fas fa-search text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            <div className="ml-auto flex items-center gap-1">
              <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold">
                🤔
              </span>
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                CC
              </span>
            </div>
          </div>
        </header>

        <div className="divide-y divide-gray-100">
          <button type="button" className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <i className="far fa-file-alt text-lg" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-gray-800">Archived chats</h3>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">1</span>
              </div>
              <p className="text-[10px] text-gray-500 truncate">Group members, text snippets...</p>
            </div>
          </button>

          <button type="button" className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <i className="fas fa-bookmark text-lg" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-gray-800">Saved Messages</h3>
                <span className="text-[10px] text-gray-400">1:04 PM</span>
              </div>
              <p className="text-[10px] text-blue-600 truncate">Him: The QA Tester Handout.pdf</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/customer/bookings/quotes')}
            className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-gray-50"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              S
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[8px] font-semibold text-gray-800">Sarah Jenkins</h3>
                <span className="text-[10px] text-gray-400">8:55 AM</span>
              </div>
              <p className="text-[10px] text-gray-500 truncate">maybe yes</p>
            </div>
            <span className="text-red-500 text-sm">❤️</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
