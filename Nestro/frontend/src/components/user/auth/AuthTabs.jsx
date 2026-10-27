const tabs = [
  { id: 'signin', label: 'Sign In' },
  { id: 'signup', label: 'Create Account' },
]

export default function AuthTabs({ mode, setMode }) {
  return (
    <div className="flex gap-6 border-b border-[#E8E0D5] mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setMode(tab.id)}
          className={`pb-3 text-[15px] font-medium transition-colors relative ${
            mode === tab.id
              ? 'text-[#8B5E3C]'
              : 'text-[#6B7280] hover:text-[#1E1E1E]'
          }`}
        >
          {tab.label}
          {mode === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8B5E3C]" />
          )}
        </button>
      ))}
    </div>
  )
}