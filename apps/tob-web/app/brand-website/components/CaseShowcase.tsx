/**
 * 客户案例展示组件
 */

interface Case {
  id: string;
  clientName: string;
  logo?: string;
  description: string;
  tags: string[];
}

interface CaseShowcaseProps {
  cases: Case[];
  title?: string;
  subtitle?: string;
}

export default function CaseShowcase({
  cases,
  title = '客户案例',
  subtitle = '来自各行业合作伙伴的信任之选',
}: CaseShowcaseProps) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-500">{subtitle}</p>
        </div>

        {/* Logo Wall */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-16 opacity-60">
          {cases.slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="w-32 h-16 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <span className="text-gray-400 font-bold text-sm">{c.clientName}</span>
            </div>
          ))}
        </div>

        {/* Case Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {caseItem.clientName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {caseItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {caseItem.logo && (
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs text-gray-400">LOGO</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed">{caseItem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
