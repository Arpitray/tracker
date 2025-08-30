import React from 'react';

/**
 * HabitCard
 * Props:
 * - children or text: content inside the paper area
 */
export default function HabitCard({ children, className = '' }) {
  // rotation and x/y are handled by the parent motion wrapper so we keep this component pure

  return (
    <div className={`inline-block align-top m-6 ${className}`}>
      {/* outer orange frame offset to create the layered look */}
      <div className="relative">
        <div className="absolute inset-0 bg-[#FF8E42] rounded-lg translate-x-4 translate-y-4" aria-hidden></div>

        {/* main paper card */}
        <div className={`relative bg-white rounded-lg p-8 shadow-[8px_8px_0px_rgba(0,0,0,0.85)] max-w-sm min-w-[200px] ${className}`}>
          {/* clip at top */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="bg-yellow-400 w-18 h-9 rounded-b-md flex items-center justify-center shadow-md"></div>
            <div className="w-4 h-4 bg-black rounded-full -mt-2"></div>
          </div>

          <div className="pt-6 space-y-3">
            {/* children should be structured, but ensure better line-height */}
            <div className="text-[1.15rem] leading-relaxed text-gray-800 break-words">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
