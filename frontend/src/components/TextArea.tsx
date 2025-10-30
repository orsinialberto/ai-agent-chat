import React, { useEffect, useMemo, useRef } from 'react'

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  maxHeightVh?: number; // defaults to 40
  minRows?: number; // defaults to 1
  onHeightChange?: (heightPx: number) => void;
}

export const TextArea: React.FC<TextAreaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  ariaLabelledBy,
  maxHeightVh = 40,
  minRows = 1,
  disabled,
  onHeightChange,
  className,
  ...rest
}) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  const maxPx = useMemo(() => {
    if (typeof window === 'undefined') return 0
    return Math.round((window.innerHeight * maxHeightVh) / 100)
  }, [maxHeightVh])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, maxPx || el.scrollHeight)
    el.style.height = `${next}px`
    if (onHeightChange) onHeightChange(next)
  }, [value, maxPx, onHeightChange])

  return (
    <textarea
      id={id}
      ref={ref}
      className={`aic-textarea ${className ?? ''}`.trim()}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minRows}
      disabled={disabled}
      {...rest}
    />
  )
}

export default TextArea


