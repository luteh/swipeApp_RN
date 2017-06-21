/**
 * Created by Luteh on 20/06/2017.
 */
import React, {Component} from 'react'
import {
    Animated,
    PanResponder,
    Dimensions,
    Platform,
    UIManager,
    LayoutAnimation
} from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
    //to handle error message if the method doesn't exist
    static defaultProps = {
        onSwipeLeft: () => {
        },
        onSwipeRight: () => {
        }
    };

    constructor(props) {
        super(props);
        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                position.setValue({x: gesture.dx, y: gesture.dy});
            },
            //this function will call every user stopped swipe
            onPanResponderRelease: (event, gesture) => {
                //add logic to handle if user swipe greater/smaller than X scale which has been specified
                if (gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right')
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left')
                } else {
                    this.resetPosition();
                }
            }

        });

        // used to animate smooth transition of the rest of the deck
        const position2 = new Animated.ValueXY();
        this.state = {panResponder, position, index: 0, position2};
    }

    //region Used to animate the view when rerender, but have some issues to use this
    /*componentWillUpdate(){
        UIManager.setAnimationEnabledExperimental && UIManager.setAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }*/
    //endregion

    //handle if card has gone
    onSwipeComplete(direction) {
        const {onSwipeLeft, onSwipeRight, data} = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

        Animated.timing(this.state.position2, {
            toValue: { x: 0, y: -10 },
            duration: 300
        }).start(() => {
            // we update state (rerender page) ONLY after the animation is finished
            this.state.position.setValue({ x: 0, y: 0 });
            this.state.position2.setValue({ x: 0, y: 0 });
            this.setState({ index: this.state.index + 1 });
        });
    }

    //make card gone to the right or left
    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: {x, y: 0},
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    //Springing the card back to default position
    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: {x: 0, y: 0}
        }).start();
    }

    //make card be able to rotate
    getCardStyle() {
        const {position} = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.2, 0, SCREEN_WIDTH * 1.2],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{rotate: rotate}]
        }
    }

    //render the card item
    renderCards() {
        //handle if list card item is empty
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, i) => {
            //if swipe completed, the card didnt rendered
            if (i < this.state.index) {
                return null
            }

            //implement animation on each card item, specified with index item
            if (i === this.state.index) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyle]}
                        {...this.state.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                )
            }

            //render the card item
            return (
                //add animated to this view to handle the flashing image
                <Animated.View
                    key={item.id}
                    // top: 10 * (i - this.state.index) < this style is for cascading card list
                    style={[styles.cardStyle, {top: 10 * (i - this.state.index)}]}>
                    {this.props.renderCard(item)}
                </Animated.View>
            )
        }).reverse();
    }

    render() {
        return (
            <Animated.View style={this.state.position2.getLayout()}>
                {this.renderCards()}
            </Animated.View>
        )
    };
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        ...Platform.select({
            android: {
                elevation: 0.1
            }
        })
    }
};

export default Deck;