import { useCallback, useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";

const SRC = "/succes.lottie";

type PaySuccessLottieProps = {
  reducedMotion: boolean;
  onComplete: () => void;
  className?: string;
};

export default function PaySuccessLottie({ reducedMotion, onComplete, className }: PaySuccessLottieProps) {
  const [player, setPlayer] = useState<DotLottie | null>(null);
  const finished = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      finish();
    }
  }, [reducedMotion, finish]);

  useEffect(() => {
    if (reducedMotion || !player) {
      return;
    }

    player.addEventListener("complete", finish);
    const fallback = window.setTimeout(finish, 4000);

    return () => {
      player.removeEventListener("complete", finish);
      window.clearTimeout(fallback);
    };
  }, [player, reducedMotion, finish]);

  if (reducedMotion) {
    return null;
  }

  return <DotLottieReact src={SRC} autoplay loop={false} className={className} dotLottieRefCallback={setPlayer} />;
}
