import { useRef, useState, type CSSProperties } from 'react';
import { motion, useMotionValue, useSpring, type Transition as MotionTransition } from 'framer-motion';

interface Item {
  text?: string;
  /** Caption drawn over the preview image/gradient; falls back to `text` when omitted. Supports a literal "\n" for a manual line break. */
  previewText?: string;
  image?: { src?: string; srcSet?: string; alt?: string };
  link?: string;
  onClick?: () => void;
}

interface ItemsValue {
  itemCount?: number;
  [key: string]: unknown;
}

const MAX_ITEMS = 6;

interface FontValue {
  fontSize?: number | string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  [key: string]: unknown;
}

interface HoverImageRevealProps {
  items?: ItemsValue;
  font?: FontValue;
  textColor?: string;
  dimColor?: string;
  align?: 'left' | 'center' | 'right';
  rowGap?: number;
  imageWidth?: number;
  imageHeight?: number;
  rounded?: number;
  offsetX?: number;
  offsetY?: number;
  followStrength?: number;
  transition?: MotionTransition;
  backgroundColor?: string;
  style?: CSSProperties;
  /** Set false to hide the cursor-following image box and use text-only hover highlighting. */
  showPreview?: boolean;
  /** Dim every item (as if something else has focus) even when none of them is actually hovered. */
  dimAll?: boolean;
}

const DEFAULT_ITEMS: ItemsValue = {
  itemCount: 1,
  item1: { text: 'ITEM' },
};

const DEFAULT_FONT: FontValue = {
  fontSize: 61,
  lineHeight: '0.9em',
  letterSpacing: '-0.05em',
};

const DEFAULT_TRANSITION: MotionTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
  mass: 1,
};

const alignToFlex: Record<string, CSSProperties['alignItems']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};
const alignToText: Record<string, CSSProperties['textAlign']> = {
  left: 'left',
  center: 'center',
  right: 'right',
};

export default function HoverImageReveal({
  items = DEFAULT_ITEMS,
  font = DEFAULT_FONT,
  textColor = '#FFFFFF',
  dimColor = '#51565A',
  align = 'center',
  rowGap = 30,
  imageWidth = 300,
  imageHeight = 400,
  rounded = 16,
  offsetX = 200,
  offsetY = 0,
  followStrength = 0,
  transition = DEFAULT_TRANSITION,
  backgroundColor = '#000000',
  style,
  showPreview = true,
  dimAll = false,
}: HoverImageRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const stiffness = 60 + followStrength * 5;
  const springCfg = { stiffness, damping: 28, mass: 0.5 };
  const x = useSpring(rawX, springCfg);
  const y = useSpring(rawY, springCfg);

  const data = items || DEFAULT_ITEMS;
  const count = Math.max(1, Math.min(MAX_ITEMS, (data.itemCount as number) || 1));
  const list: Item[] = [];
  for (let i = 1; i <= count; i++) {
    const it = data[`item${i}`] as Item | undefined;
    list.push({
      text: it?.text ?? `Item ${i}`,
      previewText: it?.previewText,
      image: it?.image,
      link: it?.link,
      onClick: it?.onClick,
    });
  }
  const anyActive = hovered != null || dimAll;

  const onMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left + offsetX);
    rawY.set(e.clientY - rect.top + offsetY);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={() => setHovered(null)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: alignToFlex[align],
        gap: `${rowGap}px`,
        padding: 24,
        boxSizing: 'border-box',
        ...(font as CSSProperties),
        ...style,
      }}
    >
      {showPreview && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            x,
            y,
            translateX: '-50%',
            translateY: '-50%',
            width: imageWidth,
            height: imageHeight,
            borderRadius: rounded,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 2,
          }}
          animate={{ opacity: anyActive ? 1 : 0 }}
          transition={transition}
        >
          {list.map((item, i) => {
            const src = item.image?.src;
            const yPos = hovered == null ? '100%' : i < hovered ? '-100%' : i > hovered ? '100%' : '0%';
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{ y: yPos }}
                transition={transition}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
              >
                {src && !failedImages[i] ? (
                  <img
                    src={src}
                    alt={item.image?.alt || item.text || ''}
                    onError={() => setFailedImages((prev) => ({ ...prev, [i]: true }))}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#333,#111)' }} />
                )}
                {item.previewText && (
                  <div
                    data-testid="preview-caption"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 'clamp(20px, 4vw, 40px)',
                      whiteSpace: 'pre',
                      textShadow: '0 4px 18px rgba(0,0,0,0.55)',
                      padding: 12,
                      pointerEvents: 'none',
                    }}
                  >
                    {item.previewText}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div
        onMouseLeave={() => setHovered(null)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: alignToFlex[align], gap: `${rowGap}px` }}
      >
        {list.map((item, i) => {
          const isHovered = hovered === i;
          const color = anyActive ? (isHovered ? textColor : dimColor) : textColor;
          const copyStyle: CSSProperties = {
            display: 'block',
            color,
            transition: 'color 0.2s ease',
            whiteSpace: 'pre',
            textAlign: alignToText[align],
          };

          const label = (
            <motion.div
              style={{ position: 'relative' }}
              animate={{ y: isHovered ? '-100%' : '0%' }}
              transition={transition}
            >
              <span style={copyStyle}>{item.text}</span>
              <span aria-hidden style={{ ...copyStyle, position: 'absolute', top: '100%', left: 0, width: '100%' }}>
                {item.text}
              </span>
            </motion.div>
          );

          const handleActivate = () => {
            setHovered(i);
            item.onClick?.();
          };

          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onClick={handleActivate}
              style={{ overflow: 'hidden', cursor: item.link || item.onClick ? 'pointer' : 'default' }}
            >
              {item.link ? (
                <a href={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {label}
                </a>
              ) : (
                label
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
