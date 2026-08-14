/**
 * Clypra Color Format Management Hook
 * Manages active format representation, channel decompositions, clipboard copy, and error shake state.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ColorFormat, HSVA } from '../types/color';
import { formatColor, hsvaToHex, parseColor } from '../utils/colorUtils';
import { getChannelsFromHsva, parseChannelsToHsva } from '../utils/colorValidation';

export interface UseColorFormatOptions {
  hsva: HSVA;
  initialFormat?: ColorFormat;
  showAlpha?: boolean;
  onColorChange?: (hsva: HSVA) => void;
  onColorChangeComplete?: (hsva: HSVA) => void;
}

export interface UseColorFormatReturn {
  format: ColorFormat;
  setFormat: (format: ColorFormat) => void;
  formattedString: string;
  channels: Record<string, number>;
  hexInputValue: string;
  isErrorShaking: boolean;
  copied: boolean;
  copyToClipboard: () => Promise<boolean>;
  handleChannelChange: (channelKey: string, rawValue: string | number) => boolean;
  handleTextInputChange: (text: string) => boolean;
  triggerErrorShake: () => void;
}

export function useColorFormat({
  hsva,
  initialFormat = 'hex',
  showAlpha = true,
  onColorChange,
  onColorChangeComplete,
}: UseColorFormatOptions): UseColorFormatReturn {
  const [format, setFormat] = useState<ColorFormat>(initialFormat);
  const [isErrorShaking, setIsErrorShaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const formattedString = useMemo(() => {
    return formatColor(hsva, format, showAlpha);
  }, [hsva, format, showAlpha]);

  const hexInputValue = useMemo(() => {
    return hsvaToHex(hsva, showAlpha && hsva.a < 0.999);
  }, [hsva, showAlpha]);

  const channels = useMemo(() => {
    return getChannelsFromHsva(hsva, format);
  }, [hsva, format]);

  const triggerErrorShake = useCallback(() => {
    setIsErrorShaking(true);
    setTimeout(() => {
      setIsErrorShaking(false);
    }, 400);
  }, []);

  const handleChannelChange = useCallback(
    (channelKey: string, rawValue: string | number): boolean => {
      const nextChannels: Record<string, string | number> = {
        ...channels,
        [channelKey]: rawValue,
      };

      const newHsva = parseChannelsToHsva(format, nextChannels, hsva);
      if (newHsva) {
        onColorChange?.(newHsva);
        onColorChangeComplete?.(newHsva);
        return true;
      }
      triggerErrorShake();
      return false;
    },
    [channels, format, hsva, onColorChange, onColorChangeComplete, triggerErrorShake]
  );

  const handleTextInputChange = useCallback(
    (text: string): boolean => {
      const parsed = parseColor(text);
      if (parsed) {
        onColorChange?.(parsed);
        onColorChangeComplete?.(parsed);
        return true;
      }
      triggerErrorShake();
      return false;
    },
    [onColorChange, onColorChangeComplete, triggerErrorShake]
  );

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedString);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return true;
      }
    } catch {
      // Ignore clipboard failure
    }
    return false;
  }, [formattedString]);

  return {
    format,
    setFormat,
    formattedString,
    channels,
    hexInputValue,
    isErrorShaking,
    copied,
    copyToClipboard,
    handleChannelChange,
    handleTextInputChange,
    triggerErrorShake,
  };
}
