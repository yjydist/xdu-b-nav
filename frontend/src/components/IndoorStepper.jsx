import { ArrowRight, Footprints, DoorOpen, ArrowUpDown } from 'lucide-react';
import styles from './IndoorStepper.module.css';

const getStepIcon = (action) => {
  if (action.includes('进入') || action.includes('出')) return DoorOpen;
  if (action.includes('上楼') || action.includes('下楼')) return ArrowUpDown;
  if (action.includes('直行') || action.includes('移动')) return ArrowRight;
  return Footprints;
};

function IndoorStepper({ indoor, path }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>室内导航</h3>

      <div className={styles.steps}>
        {indoor.map((step, index) => {
          const StepIcon = getStepIcon(step.action);
          return (
            <div key={index} className={styles.step}>
              <div className={styles.stepIcon}>
                <StepIcon size={16} />
              </div>
              <div className={styles.stepContent}>
                <p className={styles.stepAction}>{step.action}</p>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {path && path.length > 0 && (
        <>
          <div className={styles.divider} />
          <div>
            <p className={styles.nodesTitle}>完整经过节点</p>
            <div className={styles.nodes}>
              {path.map((node, index) => (
                <span key={index} className={styles.node}>
                  {index + 1}. {node}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default IndoorStepper;
