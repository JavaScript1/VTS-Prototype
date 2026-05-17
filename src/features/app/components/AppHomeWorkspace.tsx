import type { ReactNode } from 'react';
import AppBottomBar, { type AppBottomBarProps } from './AppBottomBar';
import AppHomeMap, { type AppHomeMapProps } from './AppHomeMap';
import AppSidebar, { type AppSidebarProps } from './AppSidebar';
import type { HomeViewMode } from '../utils/viewModes';

type AppHomeWorkspaceProps = {
  mode: HomeViewMode;
  sidebarProps: AppSidebarProps;
  mapProps: AppHomeMapProps;
  bottomBarProps: AppBottomBarProps;
  rightRail?: ReactNode;
  mapOverlay?: ReactNode;
};

export default function AppHomeWorkspace({
  mode,
  sidebarProps,
  mapProps,
  bottomBarProps,
  rightRail,
  mapOverlay,
}: AppHomeWorkspaceProps) {
  const showSidebar = true;
  const effectiveSidebarPosition = mode === 'normal' ? sidebarProps.sidebarPosition : 'left';

  return (
    <>
      <main className="relative flex flex-1 overflow-hidden">
        <div
          className={`flex min-w-0 flex-1 ${
            effectiveSidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {showSidebar ? <AppSidebar {...sidebarProps} sidebarPosition={effectiveSidebarPosition} /> : null}

          <div className="relative flex min-w-0 flex-1 overflow-hidden">
            <AppHomeMap {...mapProps} />
            {mapOverlay}
          </div>
        </div>

        {rightRail}
      </main>

      <AppBottomBar {...bottomBarProps} />
    </>
  );
}
