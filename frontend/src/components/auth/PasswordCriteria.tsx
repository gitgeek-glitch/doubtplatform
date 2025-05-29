import { Check, X } from "lucide-react"

interface PasswordCriteriaProps {
  show: boolean
  criteria: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export default function PasswordCriteria({ show, criteria }: PasswordCriteriaProps) {
  if (!show) return null

  return (
    <div className="auth-password-criteria">
      <p className="auth-password-criteria-title">Password must contain:</p>
      <ul className="auth-password-criteria-list">
        <li
          className={`auth-password-criteria-item ${criteria.length ? "auth-criteria-met" : "auth-criteria-unmet"}`}
        >
          {criteria.length ? (
            <Check className="auth-criteria-icon" />
          ) : (
            <X className="auth-criteria-icon" />
          )}
          At least 8 characters
        </li>
        <li
          className={`auth-password-criteria-item ${criteria.uppercase ? "auth-criteria-met" : "auth-criteria-unmet"}`}
        >
          {criteria.uppercase ? (
            <Check className="auth-criteria-icon" />
          ) : (
            <X className="auth-criteria-icon" />
          )}
          At least one uppercase letter
        </li>
        <li
          className={`auth-password-criteria-item ${criteria.lowercase ? "auth-criteria-met" : "auth-criteria-unmet"}`}
        >
          {criteria.lowercase ? (
            <Check className="auth-criteria-icon" />
          ) : (
            <X className="auth-criteria-icon" />
          )}
          At least one lowercase letter
        </li>
        <li
          className={`auth-password-criteria-item ${criteria.number ? "auth-criteria-met" : "auth-criteria-unmet"}`}
        >
          {criteria.number ? (
            <Check className="auth-criteria-icon" />
          ) : (
            <X className="auth-criteria-icon" />
          )}
          At least one number
        </li>
        <li
          className={`auth-password-criteria-item ${criteria.special ? "auth-criteria-met" : "auth-criteria-unmet"}`}
        >
          {criteria.special ? (
            <Check className="auth-criteria-icon" />
          ) : (
            <X className="auth-criteria-icon" />
          )}
          At least one special character (recommended)
        </li>
      </ul>
    </div>
  )
}