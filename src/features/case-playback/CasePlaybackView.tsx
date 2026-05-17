/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type CasePlaybackViewProps = {
  onOpenPlayback: (index: number) => void;
};

export default function CasePlaybackView({ onOpenPlayback: _onOpenPlayback }: CasePlaybackViewProps) {
  return <main className="flex-1 bg-slate-50" />;
}
