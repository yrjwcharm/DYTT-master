/**
 * Video
 */

import React, { PureComponent } from 'react';
import {
    AppState,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    NativeModules,
    Slider,
    StatusBar,
    PanResponder,
    Text,
    LayoutAnimation,
    View,
} from 'react-native';

import Touchable from './Touchable';
import { timeFormat } from '../../util/timeformat';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import IconF from 'react-native-vector-icons/FontAwesome5';

const { UIManager } = NativeModules;

const VideoBarMini = ({themeColor,playableDuration,currentTime,duration,isFull,isShowBar}) => (
    <View pointerEvents="none" style={[styles.progresscon,isFull&&styles.progressconFull,!isShowBar&&{bottom:0}]}>
        <View style={[styles.progressbar,{backgroundColor:themeColor,flex:currentTime}]}/>
        <View style={[styles.progressbar,{backgroundColor:themeColor,opacity:.5,flex:playableDuration>currentTime?playableDuration-currentTime:0}]}/>
        <View style={[styles.progressbar,{flex:duration-(playableDuration>currentTime?playableDuration:currentTime)}]}/>
    </View>
)

const VideoBar = ({themeColor,toSeek,toPlay,playableDuration,currentTime,duration,isFull,paused,toFull,isShowBar}) => (
    <View style={[styles.videobar,isFull&&styles.videobarFull,!isShowBar&&{bottom:isFull?-70:-40}]}>
        {
            /*
            <Touchable
                onPress={toPlay}
                style={styles.videobtn}
            >
                <Icon name={paused?'play':'pause'} size={20} color='#333' />
                {
                    //<IconE name={paused?'controller-play':'controller-paus'} size={22} color='#333' />
                }
            </Touchable>
            */
        }
        <Text style={[styles.videotime,isFull&&{fontSize:14}]}><Text style={{color:themeColor}}>{timeFormat(currentTime)}</Text>{' / '+timeFormat(duration)}</Text>
        <View style={[styles.videoslider,isFull&&{marginHorizontal:10}]}>
            <Slider
                style={styles.videosliderbar}
                value={currentTime}
                onValueChange={(value)=>toSeek(value,false,true)}
                onSlidingComplete={(value)=>toSeek(value,true,true)}
                maximumValue={duration}
                maximumTrackTintColor="#333"
                minimumTrackTintColor={themeColor}
                thumbTintColor={themeColor}
            />
            <View pointerEvents="none" style={[styles.videoslidercon,{backgroundColor:themeColor,flex:playableDuration}]}/>
            <View pointerEvents="none" style={[styles.videoslidercon,{flex:duration-playableDuration}]}/>
        </View>
        <Touchable
            onPress={toFull}
            style={[styles.videobtn,isFull&&{padding:5}]}
        >
            <Icon name={isFull?'minimize':'maximize'} size={isFull?22:20} color='#333' />
        </Touchable>
    </View>
)

export default class extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            duration: 0,
            playableDuration: 0,
            currentTime: 0,
            $currentTime: 0,
            paused: true,
            isBuffering:true,
            isFull:false,
            isError:false,
            isShowBar:false,
            isEnd:false
        };
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    playState = false;

    /*
    * to + 方法名  
    * 主动调用方法
    */
    toFull = () => {
        const {isFull} = this.state;
        StatusBar.setHidden(!isFull);
        this.setState({isFull: !isFull})
        this.props.onfullChanged&&this.props.onfullChanged(!isFull);
        //this.video.presentFullscreenPlayer()
    }

    toPlay = (bool) => {
        const { isReady,currentTime } = this.state;
        if( isReady ){
            this.toShowBar();
            this.setState({ 
                paused: !bool,
                isError: false,
            });
            if(currentTime){
                this.setState({ isEnd:false });
            }
        }
    }

    toTogglePlay = () => {
        this.toPlay(this.state.paused);
    }

    toPause = () => {
        this.setState({ paused: true });
    }

    toSeek = (value,bool,show) => {
        LayoutAnimation.easeInEaseOut();
        this.setState({
            currentTime: value,
        });
        if(bool){
            this.video.seek(value);
        }else{
            this.isSeeking = true;
        }
        if(show){
            this.toShowBar();
        }
    }

    toHideBar = () => {
        this.timer&&clearTimeout(this.timer);
        LayoutAnimation.easeInEaseOut();
        this.props.onHideBar&&this.props.onHideBar();
        this.setState({
            isShowBar:false
        })
    }

    toShowBar = () => {
        this.timer&&clearTimeout(this.timer);
        LayoutAnimation.easeInEaseOut();
        this.props.onShowBar&&this.props.onShowBar();
        this.setState({
            isShowBar:true
        })
        this.timer = setTimeout(()=>{
            this.toHideBar()
        },5000)
    }

    toEnd = () => {
        this.toSeek(0,true);
        this.timer&&clearTimeout(this.timer);
        LayoutAnimation.easeInEaseOut();
        this.setState({
            paused:true,
            isEnd:true
        })
    }

    /*
    * on + 方法名  
    * 回调方法
    */

    onFullscreenPlayerDidPresent = () => {
        //console.warn('onFullscreenPlayerDidPresent')
    }

    onLoad = (data) => {
        //console.warn('onLoad')
        this.setState({
            isReady: true,
            duration: data.duration,
            //paused:false
        });
        if(this.props.seekTime>0){
            this.video.seek(this.props.seekTime);
        }
        //this.toShowBar(true);
    }

    onEnd = () => {
        if(this.props.onEnd&& (typeof this.props.onEnd === 'function')){
            this.props.onEnd();
        }else{
            this.toEnd();
        }
    }

    onBuffer = (event) => {
        this.setState({
            isBuffering:event.isBuffering
        })
    }

    onError = (event) => {
        this.setState({
            isError:true,
            isBuffering:false
        })
    }

    onProgress = (data) => {
        if(!this.isSeeking){
            LayoutAnimation.easeInEaseOut();
            this.setState({ 
                currentTime: data.currentTime,
                playableDuration: data.playableDuration
            });
        }
    };

    onSeek = (data) => {
        this.isSeeking = false;
        this.setState({ 
            currentTime: data.seekTime,
        });
    }

    onTimedMetadata = (data) => {
        //console.warn(data)
    }

    //手势
    onPanResponderGrant = () => {
        this.$currentTime = this.state.currentTime;
        this.$duration = this.state.duration;
        this.$isMoved = false;
    }

    onPanResponderMove = (evt, gestureState) => {

        if(!this.state.duration){
            if(Math.abs(gestureState.dx)>20||Math.abs(gestureState.dy)>20){
                this.$isMoved = true;
            }
            return false
        }
        
        //进度
        if(Math.abs(gestureState.dx)>20&&Math.abs(gestureState.dy)<50){
            this.$isMoved = true;
            let current = this.$currentTime+gestureState.dx*.2;
            if(current < 0){
                current = 0;
            }
            if(current > this.$duration){
                current = this.$duration;
            }
            this._currentTime = current;
            this._isSet = true;
            this.setState({
                $currentTime:current,
                $isMove:true
            });
        }else{
            this._isSet = false;
            this.setState({$isMove:false})
        }

    }

    onPanResponderRelease = (evt, gestureState) => {
        //console.warn('onPanResponderRelease')
        if(this._isSet){ 
            this.setState({$isMove:false});
            this._isSet = false;
            this.toSeek(this._currentTime, true);
            // this.video.seek(_currentTime);
        }
        if(!this.$isMoved){
            const {isShowBar} = this.state;
            if(isShowBar){
                this.toHideBar();
            }else{
                this.toShowBar();
            }
        }
    }

    _handleAppStateChange = (nextAppState) => {
        if(nextAppState === 'active'){
            this.setState({paused:!this.prePlayState});
        }else{
            this.prePlayState = !this.state.paused;
            if(this.prePlayState){
                this.setState({paused:true})
            }
        }
    }

    componentWillMount() {
        AppState.addEventListener('change', this._handleAppStateChange);
        this._panResponder = PanResponder.create({
            // 要求成为响应者：
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

            onPanResponderGrant: this.onPanResponderGrant,
            onPanResponderMove: this.onPanResponderMove,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: this.onPanResponderRelease,
            onPanResponderTerminate: (evt, gestureState) => {
                // 另一个组件已经成为了新的响应者，所以当前手势将被取消。
            },
            onShouldBlockNativeResponder: (evt, gestureState) => {
                // 返回一个布尔值，决定当前组件是否应该阻止原生组件成为JS响应者
                // 默认返回true。目前暂时只支持android。
                return true;
            },
        });
    }
    
    componentDidUpdate(prevProps, prevState) {
        if (this.props.uri !== prevProps.uri) {
            this.setState({
                isReady:false,
                isError:false,
                duration:0,
                currentTime:0,
                playableDuration:0
            })
        }
    }

    componentWillUnmount(){
        AppState.removeEventListener('change', this._handleAppStateChange);
        this.timer&&clearTimeout(this.timer);
    }

    render(){
        const {style,uri,themeColor} = this.props;
        const {paused,isReady,currentTime,duration,playableDuration,isBuffering,isFull,isError,isEnd,isShowBar,$isMove,$currentTime} = this.state;
        return (
            <View style={[styles.container,style]}>
                {
                    uri?
                    <Video
                        ref={(ref) => this.video = ref}
                        style={styles.fullScreen}
                        useTextureView={false}
                        progressUpdateInterval={1000}
                        source={{uri:uri}}
                        paused={paused}
                        resizeMode="contain"
                        onFullscreenPlayerDidPresent={this.onFullscreenPlayerDidPresent}
                        onLoad={this.onLoad}
                        onProgress={this.onProgress}
                        onSeek={this.onSeek}
                        onBuffer={this.onBuffer}
                        onEnd={this.onEnd}
                        onError={this.onError}
                        onTimedMetadata={this.onTimedMetadata}
                        bufferConfig={{
                            minBufferMs: 15000,
                            maxBufferMs: 6000000,
                            bufferForPlaybackMs: 5000,
                            bufferForPlaybackAfterRebufferMs: 10000
                        }}
                        repeat={false}
                    />
                    :
                    null
                }
                <View pointerEvents={(isShowBar||paused)?"auto":"none"} style={[styles.playbtnWrap,(!isShowBar&&!paused||!isReady)&&{left:-50},isShowBar&&{bottom:isFull?80:60}]} ><TouchableOpacity style={styles.playbtn} activeOpacity={.8} onPress={this.toTogglePlay}><IconF name={paused?'play':'pause'} size={20} color={themeColor} /></TouchableOpacity></View>
                <View {...this._panResponder.panHandlers} style={[styles.fullScreen,{zIndex:5}]}>
                    <ActivityIndicator pointerEvents="none" color={themeColor} size={isFull?'large':'small'} style={!isBuffering&&{opacity:0,zIndex:-1}} />
                    <Text pointerEvents="none" style={[styles.tips,!isError&&{opacity:0}]}>╮(╯﹏╰）╭ 抱歉，视频播放失败</Text>
                    <Text pointerEvents="none" style={[styles.tips,(!(isEnd&&!currentTime))&&{opacity:0}]}>播放完成</Text>
                    <Text pointerEvents="none" style={[styles.showTime,isFull&&styles.showTimeFull,!$isMove&&{opacity:0}]}>
                        <Text style={{color:themeColor}}>{timeFormat($currentTime)}</Text>
                        /{timeFormat(duration)}
                    </Text>
                </View>
                <VideoBar
                    paused={paused}
                    isShowBar={isShowBar}
                    themeColor={themeColor}
                    currentTime={currentTime}
                    playableDuration={playableDuration}
                    duration={duration}
                    isFull={isFull}
                    toSeek={this.toSeek}
                    toPlay={this.toPlay}
                    //onSection={onSection}
                    //actionBar={actionBar}
                    toFull={this.toFull}
                />
                <VideoBarMini
                    isShowBar={isShowBar}
                    themeColor={themeColor}
                    currentTime={currentTime}
                    playableDuration={playableDuration}
                    duration={duration}
                    isFull={isFull}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        zIndex:10,
        overflow: 'hidden',
    },
    fullScreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videobar:{
        position: 'absolute',
        zIndex:10,
        left: 0,
        bottom: 0,
        right: 0,
        flexDirection:'row',
        alignItems: 'center',
        backgroundColor:'rgba(255,255,255,.7)'
    },
    videobarFull:{
        left: 10,
        bottom: 10,
        right: 10,
        borderRadius:50,
        padding:5
    },
    videobtn:{
        width:40,
        height:40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoslider:{
        flex:1,
        marginHorizontal:5,
        flexDirection:'row',
        alignItems: 'center',
    },
    videosliderbar:{
        position:'absolute',
        zIndex:5,
        left:-16,
        right:-16,
    },
    videoslidercon:{
        height:2,
        opacity:.5
    },
    videotime:{
        fontSize:12,
        color:'#333',
        paddingHorizontal:10,
    },
    showTime:{
        position: 'absolute',
        zIndex:20,
        backgroundColor:'rgba(255,255,255,.7)',
        color:'#333',
        top:'10%',
        fontSize:18,
        paddingHorizontal:10,
        paddingVertical:5,
        borderRadius:5
    },
    showTimeFull:{
        fontSize:24,
        paddingHorizontal:15,
        paddingVertical:10,
        borderRadius:10
    },
    tips:{
        color:'#fff',
        position:'absolute'
    },
    progresscon:{
        position:'absolute',
        bottom:-2,
        left:0,
        right:0,
        height:2,
        flexDirection:'row',
        backgroundColor:'rgba(255,255,255,.7)'
    },
    progressconFull:{
        bottom:-3,
        height:3,
        // borderRadius:3,
        //overflow:'hidden'
    },
    progressbar:{
        height:'100%',
    },
    playbtnWrap:{
        position:'absolute',
        left:20,
        bottom:20,
        zIndex:15
    },
    playbtn:{
        width:50,
        height:50,
        borderRadius:100,
        backgroundColor:'rgba(255,255,255,.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});