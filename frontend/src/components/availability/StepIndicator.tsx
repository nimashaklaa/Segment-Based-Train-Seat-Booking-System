interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < currentStep
                  ? 'bg-green-500 text-white'
                  : i === currentStep
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </span>
            <span
              className={`text-xs hidden sm:block ${i === currentStep ? 'font-semibold text-blue-700' : 'text-gray-400'}`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 border-t border-gray-200 mx-2" />}
        </div>
      ))}
    </div>
  )
}
