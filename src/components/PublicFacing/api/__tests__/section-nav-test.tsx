import React from "react";
import renderer, { act } from "react-test-renderer";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from "react-native";

import { useSectionNav } from "../SectionNav";

jest.mock("expo-router", () => ({ Link: "Link" }));

describe("SectionNav scroll and selection", () => {
  it("collapses after scrolling past, scrolls to a native target, and expands again on return", () => {
    let current: ReturnType<typeof useSectionNav> | undefined;
    let inlineY = 120;
    const scrollTo = jest.fn();

    function Harness() {
      current = useSectionNav();
      return null;
    }

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<Harness />);
    });

    const nav = current!;
    nav.inlineRef.current = {
      measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, inlineY, 300, 40),
    } as View;
    nav.viewportRef.current = {
      measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 20, 390, 800),
    } as View;
    nav.scrollRef.current = { scrollTo } as unknown as ScrollView;

    const scrollEvent = { nativeEvent: { contentOffset: { y: 100 } } } as NativeSyntheticEvent<NativeScrollEvent>;
    act(() => nav.onScroll(scrollEvent));
    expect(current!.controller.isPast).toBe(false);

    inlineY = -30;
    act(() => nav.onScroll(scrollEvent));
    expect(current!.controller.isPast).toBe(true);

    nav.registerTarget("install")({
      measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => callback(0, 700, 300, 40),
    } as View);
    act(() => current!.controller.navigateTo("install"));
    expect(scrollTo).toHaveBeenCalledWith({ y: 780, animated: true });
    expect(current!.controller.isOpen).toBe(false);

    act(() => current!.controller.setIsOpen(true));
    expect(current!.controller.isOpen).toBe(true);

    inlineY = 120;
    act(() => nav.onScroll(scrollEvent));
    expect(current!.controller.isPast).toBe(false);
    expect(current!.controller.isOpen).toBe(false);

    act(() => tree!.unmount());
  });
});
