import { useState, type CSSProperties } from 'react';
import { ReactCompareSliderImage } from 'react-compare-slider';
import { Handle, HandleRoot, Item, Provider, Root } from 'react-compare-slider/components';
import { useReactCompareSlider } from 'react-compare-slider/hooks';
import { compareControl, comparePosition, type ComparePair } from './before-after.ts';
import './before-after.css';

export function PublicCompare({ pair }: { pair: ComparePair }) {
  const [position, setPosition] = useState(50);
  const slider = useReactCompareSlider({
    defaultPosition: position,
    keyboardIncrement: '5%',
    onPositionChange: (next) => setPosition(comparePosition(next)),
    onlyHandleDraggable: true,
  });
  return (
    <div className="compare">
      <Provider {...slider}>
        <Root style={{ width: '100%', aspectRatio: `${pair.before.width} / ${pair.before.height}` }}>
          <Item item="itemOne">
            <ReactCompareSliderImage src={pair.before.src} alt={pair.before.alt} />
          </Item>
          <Item item="itemTwo">
            <ReactCompareSliderImage src={pair.after.src} alt={pair.after.alt} />
          </Item>
          <HandleRoot aria-label="Porównanie przed i po">
            <Handle
              buttonStyle={{
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                backgroundColor: 'var(--kamien)',
                boxShadow: 'none',
              }}
              linesStyle={{ boxShadow: 'none' }}
              style={{ '--rcs-handle-color': 'var(--igliwie)' } as CSSProperties}
            />
          </HandleRoot>
        </Root>
      </Provider>
      {compareControl(position, setPosition)}
    </div>
  );
}
