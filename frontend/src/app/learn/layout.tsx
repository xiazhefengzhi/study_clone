import { Sidebar } from "@/components/sidebar"

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-[240px]">
        {children}
      </div>
    </div>
  )
}
