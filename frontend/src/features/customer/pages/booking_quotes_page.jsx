const BookingQuotesPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-[750px] border border-gray-200">
        <div className="flex-1 flex flex-col border-r border-gray-100">
          <div className="p-5 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
                S
              </div>
              <div>
                <h2 className="font-bold text-slate-700 text-lg">Sarah Jenkins</h2>
                <p className="text-xs text-green-500 font-medium">● Deep Cleaning Job - #JOB-8921</p>
              </div>
            </div>
            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Job info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white">
            <div className="text-center">
              <span className="bg-blue-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Today
              </span>
            </div>

<<<<<<< HEAD
          <div className="quote-list">
            {quotes.map((item, index) => (
              <article key={item.id} className="quote-card">
                <div className={`avatar avatar-${index + 1}`} aria-hidden />
                <div className="quote-content">
                  <div className="name-row">
                    <h2>{item.name}</h2>
                    <BadgeCheck size={16} />
                    {item.tag === 'TEAM' && <span className="tag">TEAM</span>}
                  </div>
                  <p className="stats">
                    <span><Star size={14} /> {item.rating}</span>
                    <span>{item.completed} Cleanings completed</span>
                  </p>
                  <p className="note">&quot;{item.note}&quot;</p>
                  <div className="actions">
                    <button type="button" className="chat-btn" onClick={() => navigate(`/customer/bookings/quotes/chat/${item.id}`)}>
                      <MessageSquare size={14} />
                      Chat to Negotiate
                    </button>
                    <button type="button" className="profile-btn" onClick={() => navigate('/customer/profile')}>
                      View Full Profile
                    </button>
                  </div>
=======
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                S
              </div>
              <div className="flex flex-col">
                <div className="bg-slate-100 p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-sm text-slate-700 leading-relaxed shadow-sm">
                  Hi! I&#39;m looking forward to tomorrow&#39;s cleaning. Please focus on kitchen cabinets.
>>>>>>> develop
                </div>
                <span className="text-[10px] text-gray-400 mt-1 ml-1">10:42 AM</span>
              </div>
            </div>

            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                S
              </div>
              <div className="flex flex-col">
                <div className="bg-slate-100 p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-sm text-slate-700 leading-relaxed shadow-sm">
                  Could you also clean the windows? I&#39;m happy to pay extra for that.
                </div>
                <span className="text-[10px] text-gray-400 mt-1 ml-1">10:45 AM</span>
              </div>
            </div>

            <div className="flex flex-col items-end ml-auto max-w-[85%]">
              <div className="bg-[#34C759] text-white py-3 px-6 rounded-full text-sm leading-relaxed shadow-sm">
                Of course. I can add window cleaning to this service. It should take around an extra hour.
              </div>
              <span className="text-[10px] text-gray-400 mt-1 mr-1">10:48 AM</span>
            </div>
          </div>

          <div className="p-4 border-t flex items-center gap-3 bg-white">
            <button type="button" className="text-gray-400 hover:text-blue-500" aria-label="Add attachment">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <button type="button" className="text-green-500 hover:scale-110 transition-transform" aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="w-full md:w-80 p-5 bg-white border-l border-gray-50 overflow-y-auto">
          <h3 className="text-center font-extrabold text-slate-400 text-[11px] tracking-widest mb-6 uppercase">
            Job Details
          </h3>

          <div className="space-y-4 mb-8">
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Date & Time</p>
                <p className="text-sm font-black text-slate-700">Tomorrow, 9:00 AM</p>
              </div>
            </div>
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                <p className="text-sm font-black text-slate-700 leading-tight">24 Garden St, Phnom Penh</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-[11px] font-black text-slate-600 mb-4 uppercase tracking-tighter">Checklist Preview</h4>
            <ul className="text-sm space-y-3 text-slate-600">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-green-500 text-green-500 text-[10px]">
                  ✔
                </span>
                Kitchen Deep Clean
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-green-500 text-green-500 text-[10px]">
                  ✔
                </span>
                Bathroom Sanitization
              </li>
              <li className="flex items-center gap-3 font-medium text-slate-400">
                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-300 text-[10px]">
                  ○
                </span>
                Window Cleaning (Pending)
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="w-full border border-gray-200 text-slate-600 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Full Job Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingQuotesPage;
