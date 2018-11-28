<h1 align="center">
<br>
 React Native Circle Reveal View
 </br>
 <br>

</h1>
<p align="center">

 <img  src="https://raw.githubusercontent.com/lvlrSajjad/react-native-circle-reveal-view/master/circular-reveal.gif" width="30%">
</p>
<h2 align="center">Usage</h2>

A Simple view just reveals with circular transition written in pure js

installation :  
 ```
 npm install react-native-animatable react-native-circle-reveal-view --save
```
import :
```jsx harmony
import CircleTransition from 'react-native-circle-reveal-view'
```
usage :
```jsx harmony
        <CircleTransition
          ref={(ref) => this.transitedView = ref}
          backgroundColor={'white'}
          duration={500}
          style={{position: 'absolute', bottom: 48, right: 0, left: 0}}
          revealPositionArray={{bottom:true,left:true}}// must use less than two combination e.g bottom and left or top right or right
        >
          <View style={{flexDirection: 'row', width: '100%'}}>
            <View style={{flex: 1,alignItems:'center',justifyContent:'center'}}>
              <TouchableOpacity style={{
                backgroundColor: MaterialColors.red.C500,
                width: 48,
                ... // A bunch of child views
        </CircleTransition>
        
        // use it like
        onPress={() => {
            this.transitedView.toggle()
        }}
        onPress={() => {
            this.transitedView.collapse()
        }}
        onPress={() => {
              this.transitedView.expand()
        }}
```


