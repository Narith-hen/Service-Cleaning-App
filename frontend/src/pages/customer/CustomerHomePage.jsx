import React, { useState } from 'react';
import {
  SearchOutlined,
  EnvironmentOutlined,
  BellOutlined,
  FilterOutlined,
  StarFilled,
  BookOutlined,
} from '@ant-design/icons';

const CustomerHomePage = () => {
  const [categories] = useState([
    { name: 'Cleaning', icon: 'Cleaning', color: 'bg-green-100' },
    { name: 'Repairing', icon: 'Repairing', color: 'bg-blue-100' },
    { name: 'Plumbing', icon: 'Plumbing', color: 'bg-[#32c753]/15' },
    { name: 'Shifting', icon: 'Shifting', color: 'bg-orange-100' },
  ]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-[#32c753] p-6 rounded-b-3xl text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs opacity-80">Location</p>
            <div className="flex items-center gap-1 font-semibold">
              <EnvironmentOutlined /> New York, USA
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-full relative">
            <BellOutlined style={{ fontSize: 20 }} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#32c753]"></span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchOutlined className="absolute left-3 top-3 text-gray-400" style={{ fontSize: 20 }} />
            <input
              type="text"
              placeholder="Search"
              className="w-full p-3 pl-10 rounded-xl text-gray-800 outline-none"
            />
          </div>
          <button className="bg-white p-3 rounded-xl text-[#32c753]">
            <FilterOutlined style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg text-gray-800">#SpecialForYou</h2>
          <span className="text-[#32c753] text-sm">See All</span>
        </div>
        <div className="bg-black rounded-3xl p-6 text-white relative overflow-hidden h-40 flex flex-col justify-center">
          <span className="bg-white/20 text-[10px] px-2 py-1 rounded-full w-fit mb-2">Limited time!</span>
          <h3 className="text-xl font-bold">Get Special Offer</h3>
          <p className="text-3xl font-extrabold flex items-center gap-1">
            Up to <span className="text-[#32c753]">40%</span>
          </p>
          <button className="mt-3 bg-yellow-400 text-black font-bold py-2 px-6 rounded-full w-fit text-sm">
            Claim
          </button>
          <div className="absolute right-3 bottom-3 opacity-50 text-xl">Service Pro</div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Categories</h2>
          <span className="text-[#32c753] text-sm">See all</span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          {categories.map((cat, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-semibold ${cat.color}`}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-gray-600">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Popular Services</h2>
          <span className="text-[#32c753] text-sm">See all</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative">
            <div className="h-32 bg-gray-200"></div>
            <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
              <StarFilled className="text-yellow-500" /> 4.8
            </div>
            <div className="absolute top-2 right-2 bg-[#32c753] p-1 rounded-md text-white">
              <BookOutlined style={{ fontSize: 14 }} />
            </div>
            <div className="p-3 text-sm font-semibold">Home Cleaning</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHomePage;
