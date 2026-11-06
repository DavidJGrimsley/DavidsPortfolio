import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FeaturedCard } from '../FeaturedCard';
import { PieceCard } from '../Categories/PieceCard';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/UI/HydratedIonicon', () => 'HydratedIonicon');

describe('FeaturedCard carousel component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the initial featured piece and minimal controls', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    const card = tree.root.findByType(PieceCard);
    expect(card.props.title).toBe('Medimagen');

    const nextBtn = tree.root.findByProps({ testID: 'featured-carousel-next' });
    expect(nextBtn).toBeDefined();

    const prevBtn = tree.root.findByProps({ testID: 'featured-carousel-prev' });
    expect(prevBtn).toBeDefined();

    for (let i = 0; i < 4; i++) {
      const dot = tree.root.findByProps({ testID: `featured-carousel-dot-${i}` });
      expect(dot).toBeDefined();
      expect(dot.props.accessibilityState.selected).toBe(i === 0);
    }

    act(() => tree.unmount());
  });

  it('advances to next piece when Next button is pressed', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    const nextBtn = tree.root.findByProps({ testID: 'featured-carousel-next' });
    act(() => {
      nextBtn.props.onPress();
    });

    const card = tree.root.findByType(PieceCard);
    expect(card.props.title).toBe('Sunscorned');

    const dot1 = tree.root.findByProps({ testID: 'featured-carousel-dot-1' });
    expect(dot1.props.accessibilityState.selected).toBe(true);

    act(() => tree.unmount());
  });

  it('wraps around to the last piece when Previous button is pressed on slide 0', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    const prevBtn = tree.root.findByProps({ testID: 'featured-carousel-prev' });
    act(() => {
      prevBtn.props.onPress();
    });

    const card = tree.root.findByType(PieceCard);
    expect(card.props.title).toBe('Neo Rock ’Em Sock ’Em Robots');

    const dot3 = tree.root.findByProps({ testID: 'featured-carousel-dot-3' });
    expect(dot3.props.accessibilityState.selected).toBe(true);

    act(() => tree.unmount());
  });

  it('jumps directly to a piece when its dot indicator is pressed', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    const dot2 = tree.root.findByProps({ testID: 'featured-carousel-dot-2' });
    act(() => {
      dot2.props.onPress();
    });

    const card = tree.root.findByType(PieceCard);
    expect(card.props.title).toBe('Quasicombo');
    expect(dot2.props.accessibilityState.selected).toBe(true);

    act(() => tree.unmount());
  });

  it('auto-advances every 20 seconds', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    expect(tree.root.findByType(PieceCard).props.title).toBe('Medimagen');

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Sunscorned');

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Quasicombo');

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Neo Rock ’Em Sock ’Em Robots');

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Medimagen');

    act(() => tree.unmount());
  });

  it('pauses auto-advance when hovered on web', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    expect(tree.root.findByType(PieceCard).props.title).toBe('Medimagen');

    const container = tree.root.findByProps({ testID: 'featured-carousel-container' });
    act(() => {
      container.props.onPointerEnter();
    });

    // Advance 40 seconds while hovered
    act(() => {
      jest.advanceTimersByTime(40000);
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Medimagen');

    // Mouse leave
    act(() => {
      container.props.onPointerLeave();
    });

    // Advance 20 seconds after hover ends
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Sunscorned');

    act(() => tree.unmount());
  });

  it('supports touch swipe gestures to navigate slides', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<FeaturedCard />);
    });

    const container = tree.root.findByProps({ testID: 'featured-carousel-container' });

    // Swipe left: touch start at 200, end at 100 (diff = 100 > 45) -> next
    act(() => {
      container.props.onTouchStart({ nativeEvent: { pageX: 200 } });
      container.props.onTouchEnd({ nativeEvent: { pageX: 100 } });
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Sunscorned');

    // Swipe right: touch start at 100, end at 200 (diff = -100 < -45) -> prev
    act(() => {
      container.props.onTouchStart({ nativeEvent: { pageX: 100 } });
      container.props.onTouchEnd({ nativeEvent: { pageX: 200 } });
    });
    expect(tree.root.findByType(PieceCard).props.title).toBe('Medimagen');

    act(() => tree.unmount());
  });

  it('renders single card directly without carousel controls when only one item is featured', () => {
    let singleRenderer!: renderer.ReactTestRenderer;
    const singleData: Partial<import('@/types/portfolio').Pieces> = {
      'mobile-apps': [
        {
          title: 'solo-piece',
          displayTitle: 'Solo Piece',
          isFeatured: true,
          inProgress: false,
          caption: 'Solo caption',
          picture: '/img/solo.png',
          breakdown: 'Solo breakdown',
          gif: '',
        },
      ],
    };

    act(() => {
      singleRenderer = renderer.create(<FeaturedCard data={singleData} />);
    });

    const card = singleRenderer.root.findByType(PieceCard);
    expect(card.props.title).toBe('Solo Piece');

    // Controls should not exist
    expect(singleRenderer.root.findAllByProps({ testID: 'featured-carousel-next' }).length).toBe(0);
    expect(singleRenderer.root.findAllByProps({ testID: 'featured-carousel-prev' }).length).toBe(0);
    expect(singleRenderer.root.findAllByProps({ accessibilityRole: 'tab' }).length).toBe(0);

    act(() => singleRenderer.unmount());
  });
});
