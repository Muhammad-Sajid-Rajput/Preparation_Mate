export const NoteCardSkeleton = () => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden p-[14px] flex flex-col gap-4 h-[215px] w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-2/3">
          <div className="w-5 h-5 rounded bg-[#E8F0F6] animate-shimmer shrink-0" />
          <div className="h-4 bg-[#E8F0F6] animate-shimmer rounded w-full" />
        </div>
        <div className="w-5 h-5 rounded bg-[#E8F0F6] animate-shimmer" />
      </div>
      <hr className="border-t border-outline-variant -mx-[14px]" />
      <div className="flex flex-col gap-2">
        <div className="h-3 bg-[#E8F0F6] animate-shimmer rounded w-1/3" />
        <div className="h-3 bg-[#E8F0F6] animate-shimmer rounded w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-5 w-16 bg-[#E8F0F6] animate-shimmer rounded-full" />
          <div className="h-5 w-20 bg-[#E8F0F6] animate-shimmer rounded-full" />
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <div className="flex-grow flex-1 h-[28px] bg-[#E8F0F6] animate-shimmer rounded-lg" />
        <div className="flex-grow flex-1 h-[28px] bg-[#E8F0F6] animate-shimmer rounded-lg" />
        <div className="w-[28px] h-[28px] bg-[#E8F0F6] animate-shimmer rounded-lg" />
      </div>
    </div>
  );
};

const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  if (variant === 'note-card') {
    return <NoteCardSkeleton />;
  }

  const isCircle = variant === 'circle';
  const shapeClass = isCircle ? 'rounded-full' : 'rounded-lg';

  return (
    <div
      className={`animate-pulse bg-[#E8F0F6] ${shapeClass} ${className}`}
      style={{
        width: width || (isCircle ? '40px' : '100%'),
        height: height || (isCircle ? '40px' : variant === 'text' ? '16px' : '100px'),
      }}
    />
  );
};

export default Skeleton;
