interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                i < currentStep
                  ? 'bg-blue-700 text-white'
                  : i === currentStep
                    ? 'bg-blue-700 text-white ring-4 ring-blue-100'
                    : 'bg-white border border-gray-300 text-gray-400'
              }`}
            >
              {i < currentStep ? (
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" className="w-3 h-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                i === currentStep ? 'text-blue-700' : i < currentStep ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-3">
              <div className={`h-px ${i < currentStep ? 'bg-blue-700' : 'bg-gray-200'}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
