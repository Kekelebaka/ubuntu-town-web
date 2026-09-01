'use client';
export default function Error({ reset }: { reset: () => void }) { return <div className="living-town lt-wrap" role="alert"><h1>Your next move could not load.</h1><p>Your work has not been changed. Please try again.</p><button className="lt-button" onClick={reset}>Try again</button></div>; }
