/**
 * Layout wrapper for tab-based navigation content.
 *
 * Renders children in a horizontal row and reserves a trailing spacer column
 * (10% width) to account for additional UI (e.g., tab rail, inset padding, or
 * overlay controls).
 *
 * @param props.children - The tab content to render within the container.
 *
 * @remarks
 * Export style:
 * - `export default TabContainer` is fine for single-component modules, but it
 *   makes automated refactors and symbol-based imports slightly harder because
 *   the import name is not enforced.
 * - Prefer **named exports** (`export const TabContainer = ...`) in most
 *   codebases for consistent imports, easier tooling support, and simpler
 *   large-scale refactors. If you switch to named exports, update imports
 *   accordingly.
 */
import { Platform, View, useWindowDimensions } from 'react-native'
import React from 'react'

export const TabContainer = ({ children }: { children: React.ReactNode }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

  return (
    <View className="flex-1 flex-row bg-themed">
      {children}
      {isDesktopWeb ? <View style={{ width: '10%' }} /> : null}
    </View>
  )
}