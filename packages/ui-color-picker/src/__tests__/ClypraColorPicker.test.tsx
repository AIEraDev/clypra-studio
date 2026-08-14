import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ClypraColorPicker } from '../components/ClypraColorPicker';
import type { ClypraColorPickerHandle } from '../types/color';

describe('ClypraColorPicker Component', () => {
  it('renders trigger button with initial color', () => {
    render(<ClypraColorPicker defaultValue="#8B5CF6" label="Accent Color" />);
    const trigger = screen.getByRole('button', { name: /Accent Color/i });
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toContain('#8B5CF6');
  });

  it('renders inline mode directly with picker panel', () => {
    render(<ClypraColorPicker value="#EF4444" inline={true} label="Inspector Color" />);
    expect(screen.getByText('Inspector Color')).toBeDefined();
    expect(screen.getByRole('slider', { name: /Color saturation and brightness/i })).toBeDefined();
    expect(screen.getByRole('slider', { name: /Color hue/i })).toBeDefined();
  });

  it('toggles popover dialog on trigger click', () => {
    render(<ClypraColorPicker defaultValue="#3B82F6" />);
    const trigger = screen.getByRole('button', { name: /Choose color/i });

    // Initially popover is closed
    expect(screen.queryByRole('dialog')).toBeNull();

    // Click to open
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('slider', { name: /Color saturation and brightness/i })).toBeDefined();
  });

  it('exposes imperative handle methods via ref', () => {
    const pickerRef = createRef<ClypraColorPickerHandle>();
    render(<ClypraColorPicker ref={pickerRef} defaultValue="#10B981" format="hex" />);

    expect(pickerRef.current).not.toBeNull();
    expect(pickerRef.current?.getFormat()).toBe('hex');
    expect(pickerRef.current?.getValue().toUpperCase()).toContain('#10B981');

    // Switch format via ref
    act(() => {
      pickerRef.current?.setFormat('rgb');
    });
    expect(pickerRef.current?.getFormat()).toBe('rgb');
    expect(pickerRef.current?.getValue()).toContain('rgb(');
  });

  it('handles preset selection and emits onChange & onChangeComplete', () => {
    const handleChange = vi.fn();
    const handleChangeComplete = vi.fn();

    render(
      <ClypraColorPicker
        inline={true}
        defaultValue="#FFFFFF"
        presetColors={['#EF4444', '#10B981', '#3B82F6']}
        onChange={handleChange}
        onChangeComplete={handleChangeComplete}
      />
    );

    const redPreset = screen.getByRole('button', { name: /Select preset color #EF4444/i });
    fireEvent.click(redPreset);

    expect(handleChange).toHaveBeenCalledWith('#EF4444');
    expect(handleChangeComplete).toHaveBeenCalledWith('#EF4444');
  });

  it('invokes onSavePreset when Save button is clicked', () => {
    const handleSavePreset = vi.fn();

    render(
      <ClypraColorPicker
        inline={true}
        value="#8B5CF6"
        presetColors={['#FFFFFF', '#000000']}
        onSavePreset={handleSavePreset}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Add current color to presets/i });
    fireEvent.click(saveButton);

    expect(handleSavePreset).toHaveBeenCalledWith('#8B5CF6');
  });

  it('supports format tab switching in panel', () => {
    render(<ClypraColorPicker inline={true} value="#8B5CF6" format="hex" />);

    const rgbTab = screen.getByRole('tab', { name: /rgb/i });
    fireEvent.click(rgbTab);

    expect(screen.getByLabelText(/RGB R channel/i)).toBeDefined();
    expect(screen.getByLabelText(/RGB G channel/i)).toBeDefined();
    expect(screen.getByLabelText(/RGB B channel/i)).toBeDefined();
  });
});
