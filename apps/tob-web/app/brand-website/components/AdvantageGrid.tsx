/**
 * 核心优势网格展示组件
 */

interface Advantage {
  title: string;
  description: string;
}

interface AdvantageGridProps {
  advantages: Advantage[];
}

export default function AdvantageGrid({ advantages }: AdvantageGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {advantages.map((advantage, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-blue-600 font-bold">{index + 1}</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900">{advantage.title}</h4>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">{advantage.description}</p>
        </div>
      ))}
    </div>
  );
}
