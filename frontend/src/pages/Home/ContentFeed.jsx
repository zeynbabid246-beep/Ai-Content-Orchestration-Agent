import React from "react";
import Navbar from "./components/Navbar/Navbar";
const posts = [
  {
    title: "Strengthening My App Security Strategy",
    desc: "Internal guide to improving authentication, role-based access, and zero trust principles inside my platform.",
    status: "Ready",
    tag: "Security",
    time: "10 min",
    date: "Mar 1, 2026",
  },
  {
    title: "Deployment Workflow Optimization",
    desc: "Steps and improvements I implemented to automate deployment and reduce production errors.",
    status: "Scheduled",
    tag: "DevOps",
    time: "7 min",
    date: "Mar 3, 2026",
  },
  {
    title: "Enhancing User Experience in Dashboard",
    desc: "UI/UX improvements including layout redesign, spacing, and accessibility upgrades.",
    status: "Draft",
    tag: "UI/UX",
    time: "6 min",
    date: "Feb 28, 2026",
  },
  {
    title: "API Performance Improvements",
    desc: "Optimizing backend endpoints, caching strategies, and response times for better scalability.",
    status: "Published",
    tag: "Backend",
    time: "9 min",
    date: "Feb 25, 2026",
  },
];

const StatusBadge = ({ status }) => {
  const colors = {
    Ready: "bg-green-100 text-green-700",
    Scheduled: "bg-blue-100 text-blue-700",
    Draft: "bg-gray-200 text-gray-600",
    Published: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};


const Eye = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const Pencil = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4h2m4 0h2m-4 0v16m-6-8h6" />
  </svg>
);
const Calendar = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const Send = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-6 9 6-9 6-9-6z" />
  </svg>
);

export default function ContentFeed() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen flex bg-[#4A2C4F] text-white  pt-[7em]">
      <div className="w-64 p-6 bg-[#3a213e] rounded-r-3xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">My Sections</h2>
        <div className="space-y-2">
          {["All", "Security", "DevOps", "UI/UX", "Backend"].map((item, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-700"
            >
              {item}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold mt-8 mb-4">Workflow</h2>
        <div className="space-y-2">
          {["All", "Draft", "Ready", "Scheduled", "Published"].map((item, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-700"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Content Dashboard</h1>
          <span className="bg-purple-700 px-4 py-1 rounded-full text-sm">
            {posts.length} items
          </span>
        </div>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <div
              key={index}
              className="bg-white text-black rounded-2xl shadow-md hover:shadow-xl transition p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={post.status} />
                    <span className="text-sm text-gray-500">{post.tag}</span>
                    <span className="text-sm text-gray-400">{post.time}</span>
                  </div>

                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-600 mb-2">{post.desc}</p>
                  <p className="text-sm text-gray-400">{post.date}</p>
                </div>

                <div className="flex gap-3 text-gray-500">
                  <Eye className="cursor-pointer hover:text-purple-600" />
                  <Pencil className="cursor-pointer hover:text-purple-600" />
                  <Calendar className="cursor-pointer hover:text-purple-600" />
                  <Send className="cursor-pointer hover:text-purple-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}