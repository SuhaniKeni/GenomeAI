import { useState } from 'react';
import BlastHeader from './BlastHeader.jsx';
import BlastAnalysisSummary from './BlastAnalysisSummary.jsx';
import BlastLoading from './BlastLoading.jsx';
import BlastSummary from './BlastSummary.jsx';
import BlastError from './BlastError.jsx';
import BlastEmpty from './BlastEmpty.jsx';
import BlastRecommendedActions from './BlastRecommendedActions.jsx';
import BlastScientificInterpretation from './BlastScientificInterpretation.jsx';
import BlastTechnicalDetails from './BlastTechnicalDetails.jsx';
import BlastAlignmentModal from './BlastAlignmentModal.jsx';
import styles from './BlastCard.module.css';

export default function BlastCard({ blastData, sequence, onRetry, isLoading = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const status = isLoading
    ? 'loading'
    : blastData?.status || (blastData?.top_hit ? 'completed' : 'empty');

  const topHit = blastData?.top_hit;
  const queryLen = sequence?.length || blastData?.query_length || 201;

  return (
    <div className={styles.blastCard}>
      {/* 1. Header with Metadata Strip & Tooltip */}
      <BlastHeader
        status={status}
        queryLength={queryLen}
        executionTimeMs={blastData?.execution_time_ms}
        hasTopHit={Boolean(topHit)}
      />

      {/* 2. Always-Visible Technical Summary Card */}
      <BlastAnalysisSummary
        status={status}
        queryLength={queryLen}
        executionTimeMs={blastData?.execution_time_ms}
        matchesCount={topHit ? 1 : 0}
      />

      {/* 3. State-Based View Rendering */}
      {status === 'loading' && <BlastLoading />}

      {(status === 'failed' || status === 'error') && (
        <BlastError error={blastData?.error} onRetry={onRetry} />
      )}

      {status === 'completed' && !topHit && (
        <>
          <BlastEmpty message={blastData?.message} />
          <BlastScientificInterpretation topHit={null} />
          <BlastRecommendedActions onRetry={onRetry} blastData={blastData} sequence={sequence} />
        </>
      )}

      {status === 'completed' && topHit && (
        <>
          <BlastSummary
            topHit={topHit}
            onOpenAlignment={() => setIsModalOpen(true)}
          />
          <BlastScientificInterpretation topHit={topHit} />
          <BlastRecommendedActions onRetry={onRetry} blastData={blastData} sequence={sequence} />
        </>
      )}

      {/* 4. Collapsible Technical Details Section */}
      <BlastTechnicalDetails
        queryLength={queryLen}
        executionTimeMs={blastData?.execution_time_ms}
      />

      {/* 5. Monospace Pairwise Alignment Modal Viewer */}
      <BlastAlignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topHit={topHit}
        sequence={sequence}
      />
    </div>
  );
}
