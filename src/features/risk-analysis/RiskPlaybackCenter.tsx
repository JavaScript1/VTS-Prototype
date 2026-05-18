/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import DynamicPlaybackView from '../../components/Panels/DynamicPlaybackView';
import type { AppPlaybackSession } from '../app/utils/playback';

type RiskPlaybackCenterProps = {
  playbackSession: AppPlaybackSession | null;
};

export default function RiskPlaybackCenter({ playbackSession }: RiskPlaybackCenterProps) {
  return (
    <main className="relative min-w-0 flex-1 bg-slate-50 p-4">
      <div className="relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-black shadow-sm">
        {playbackSession ? (
          <DynamicPlaybackView
            session={playbackSession}
            onClose={() => undefined}
            embedded
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-black text-white/70">
            暂无可播放的预警案例
          </div>
        )}
      </div>
    </main>
  );
}
