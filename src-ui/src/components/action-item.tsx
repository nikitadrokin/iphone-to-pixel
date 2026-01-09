import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item'

interface ActionItemProps {
  icon: ReactNode
  iconClass?: string
  title: string
  description: string
  dimmed?: boolean
  children: ReactNode
}

const ActionItem: React.FC<ActionItemProps> = ({
  icon,
  iconClass = 'text-primary',
  title,
  description,
  dimmed = false,
  children,
}) => {
  return (
    <Item className={dimmed ? 'opacity-50' : ''}>
      <ItemMedia className={iconClass}>{icon}</ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>{children}</ItemActions>
    </Item>
  )
}

export default ActionItem

// Re-export Button for convenience
export { Button }
