import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const storeName = slug === 'beijing-chaoyang' ? '北京朝阳店' : slug === 'shanghai-pudong' ? '上海浦东店' : '门店'

  return {
    title: `神机营 · ${storeName}`,
    description: `神机营体育 ${storeName} — 数字运动潮玩空间。电竞体验、VR对战、亲子运动、团建派对，在线预约！`,
    openGraph: {
      title: `神机营 · ${storeName} | 数字运动潮玩空间`,
      description: `在线预约神机营 ${storeName}，享受一流电竞赛事级体验！`,
      url: `https://${slug}.shenjiying.com`,
    },
  }
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
