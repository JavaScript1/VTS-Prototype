import { useMemo, useState } from 'react';
import { MOCK_RISK_STATS } from '../../mockData';
import { getRiskPlaybackSession } from '../app/utils/playback';

const isCollisionRisk = (risk: string) => risk.includes('碰撞');

export function useRiskPlaybackState() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    MOCK_RISK_STATS[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('全部');

  const categories = ['全部', '碰撞风险', '区域入侵', '航道超速', '走锚告警', '实况场景'];

  const filteredCases = useMemo(() => {
    return MOCK_RISK_STATS.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.risk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        category === '全部' ||
        (category === '实况场景' && item.isImageScenario) ||
        (category !== '实况场景' &&
          item.risk.includes(category.replace('风险', '').replace('告警', '')));
      return matchesSearch && matchesCategory;
    });
  }, [category, searchQuery]);

  const selectedCase = useMemo(() => {
    const activeId = filteredCases.some((item) => item.id === selectedCaseId)
      ? selectedCaseId
      : filteredCases[0]?.id ?? null;
    if (!activeId) return null;
    return MOCK_RISK_STATS.find((item) => item.id === activeId) ?? null;
  }, [filteredCases, selectedCaseId]);

  const playbackSession = useMemo(
    () => (selectedCase ? getRiskPlaybackSession(selectedCase) : null),
    [selectedCase],
  );

  return {
    categories,
    filteredCases,
    playbackSession,
    searchQuery,
    selectedCase,
    selectedCaseId,
    setCategory,
    setSearchQuery,
    setSelectedCaseId,
    isCollisionRisk,
    category,
  };
}
