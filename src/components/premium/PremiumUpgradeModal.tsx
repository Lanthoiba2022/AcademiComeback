import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Crown } from 'lucide-react'

interface PremiumUpgradeModalProps {
  trigger: ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export const PremiumUpgradeModal = ({ 
  trigger, 
  isOpen: controlledIsOpen, 
  onClose: controlledOnClose 
}: PremiumUpgradeModalProps) => {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/premium')
  }

  return (
    <div onClick={handleUpgrade}>
      {trigger}
    </div>
  )
}