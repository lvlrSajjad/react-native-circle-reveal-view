import React, { Component } from 'react'
import { View, Animated, Dimensions } from 'react-native'
import * as Animatable from 'react-native-animatable'

const {width} = Dimensions.get('window')

class CircleTransition extends Component {
    scale = new Animated.Value(0.00001)

    constructor (props) {
        super(props)
        this.state = {
            show: false,
            showChildren: true,
            animating: false
        }

        this.collapse = this.collapse.bind(this)
        this.expand = this.expand.bind(this)
        this.toggle = this.toggle.bind(this)
    }

    render () {
        const {backgroundColor, style, revealPositionArray} = this.props
        return (
            this.state.show
                ? <View
                    style={{ ...style, overflow: 'hidden' }}
                >
                    <Animated.View style={{
                        position: 'absolute',
                        backgroundColor: backgroundColor,
                        bottom: revealPositionArray.bottom === true ? -width / 2 : undefined,
                        left: revealPositionArray.left === true ? -width / 2 : undefined ,
                        top: revealPositionArray.top === true ? -width / 2 : undefined,
                        right: revealPositionArray.right === true ? -width / 2 : undefined,
                        width: width,
                        height: width,
                        borderRadius: width / 2,
                        transform: [{
                            scale: this.scale
                        }]
                    }} />
                    {this.state.showChildren &&
                    <Animatable.View ref={(ref) => { this.childContainer = ref }} style={{opacity: 0, flex: 1}}>
                        {this.props.children}
                    </Animatable.View>
                    }
                </View>
                : null
        )
    }

    expand () {
        const {duration} = this.props
        if (this.state.animating === false) {
            this.setState({show: true, animating: true}, () => {
                Animated.timing(
                    this.scale,
                    {
                        useNativeDriver: true,
                        fromValue: 0,
                        toValue: 5,
                        duration: duration
                    }
                ).start((e) => {
                    if (e.finished === true) {
                        if (this.childContainer!==null && this.childContainer !== undefined) {
                            this.childContainer.fadeIn(200).then(() => this.setState({animating: false}))
                        }
                    }
                })
            })
        }
    }

    collapse () {
        const {duration} = this.props
        if (this.state.animating === false) {
            this.setState({animating: true})
            if (this.childContainer!==null && this.childContainer !== undefined) {
                this.childContainer.fadeOut(200)
            }
            Animated.timing(
                this.scale,
                {
                    useNativeDriver: true,
                    toValue: 0,
                    duration: duration
                }
            ).start((e) => {
                if (e.finished === true) {
                    this.setState({show: false, animating: false})
                }
            })
        }
    }

    toggle () {
        this.state.show === false ? this.expand() : this.collapse()
    }
}

export default CircleTransition
