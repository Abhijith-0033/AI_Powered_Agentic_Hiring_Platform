import React from 'react';

const Skeleton = ({ className, height, width, circle, count = 1 }) => {
    const baseClasses = "animate-pulse bg-neutral-200/80 rounded";
    const circleClasses = circle ? "rounded-full" : "";

    // If count is 1, return a single element
    if (count === 1) {
        return (
            <div
                className={`${baseClasses} ${circleClasses} ${className || ''}`}
                style={{
                    height: height,
                    width: width
                }}
            />
        );
    }

    // If count > 1, return an array of elements
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`${baseClasses} ${circleClasses} ${(className || '')} mb-2 last:mb-0`}
                    style={{
                        height: height,
                        width: width
                    }}
                />
            ))}
        </>
    );
};

/**
 * Pre-defined skeleton layouts for common UI patterns
 */
Skeleton.Text = ({ lines = 3, className }) => (
    <div className={`space-y-2 ${className || ''}`}>
        <Skeleton height="1em" width="100%" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
            <Skeleton key={i} height="1em" width={`${85 + Math.random() * 15}%`} />
        ))}
    </div>
);

Skeleton.Avatar = ({ size = 40, className }) => (
    <Skeleton
        width={size}
        height={size}
        circle
        className={className}
    />
);

Skeleton.Card = ({ className }) => (
    <div className={`p-4 border border-neutral-200 rounded-xl bg-white ${className || ''}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton.Avatar size={48} />
            <div className="flex-1">
                <Skeleton height={20} width="60%" className="mb-2" />
                <Skeleton height={14} width="40%" />
            </div>
        </div>
        <Skeleton.Text lines={2} />
    </div>
);

export default Skeleton;
