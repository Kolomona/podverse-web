import React, { Fragment } from 'react'
import { Provider } from 'react-redux'
import withRedux from 'next-redux-wrapper'
import App from 'next/app'
import Router from 'next/router'
import { config as fontAwesomeConfig } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css' // Import the CSS
import { NowPlayingItem } from 'podverse-shared'
import Error from './_error'
import Alerts from '~/components/Alerts/Alerts'
import AppLinkWidget from '~/components/AppLinkWidget/AppLinkWidget'
import Auth from '~/components/Auth/Auth'
import Footer from '~/components/Footer/Footer'
import MediaModals from '~/components/MediaModals/MediaModals'
import NavBar from '~/components/NavBar/NavBar'
import MediaPlayerView from '~/components/MediaPlayerView/MediaPlayerView'
import PageLoadingOverlay from '~/components/PageLoadingOverlay/PageLoadingOverlay'
import PV from '~/lib/constants'
import { addFontAwesomeIcons } from '~/lib/fontAwesomeIcons'
import { scrollToTopOfView } from '~/lib/scrollToTop'
import { checkIfLoadingOnFrontEnd, refreshAllBrowserCookies } from '~/lib/utility'
import { disableHoverOnTouchDevices } from '~/lib/utility/disableHoverOnTouchDevices'
import { fixMobileViewportHeight } from '~/lib/utility/fixMobileViewportHeight'
import { initializeStore } from '~/redux/store'
import {
  mediaPlayerLoadNowPlayingItem, pageIsLoading,
  playerQueueLoadPriorityItems
} from '~/redux/actions'
import { actionTypes } from '~/redux/constants'
import { checkIfInMaintenanceMode, getAuthenticatedUserInfo, getNowPlayingItem, setNowPlayingItem } from '~/services'
import { appWithTranslation } from '~/../i18n'
import { getQueueItems } from '~/services/userQueueItem'
import { initializeMatomo, matomoTrackPageView } from '~/lib/matomo'
const cookie = require('cookie')
const MobileDetect = require('mobile-detect')

// Tell Font Awesome to skip adding the CSS automatically since it's being imported above
fontAwesomeConfig.autoAddCss = false

addFontAwesomeIcons()

let windowHasLoaded = false

declare global {
  interface Window {
    _paq: any
    Matomo: any
    nowPlayingItem: NowPlayingItem
    player: any
  }
}

type Props = {
  cookies: any
  isMobileDevice: boolean
  mediaPlayer: {
    nowPlayingItem: any
    playing?: boolean
  }
  modals: {
    addTo: {},
    clipCreated: {},
    forgotPassword: {},
    history: {},
    login: {},
    makeClip: {},
    queue: {},
    share: {},
    signUp: {}
  }
  newPlayingItem: any
  page: {
    isLoading?: boolean
  }
  pages: {},
  playerQueue: {
    priorityItems: any[]
  }
  playerQueueLoadPriorityItems?: any
  settings: {
    uiTheme: string
  }
  store?: any,
  user: {
    email: string
    emailVerified?: boolean
    freeTrialExpiration: any
    historyItems: any[]
    id: string
    isPublic: boolean
    mediaRefs: any[]
    membershipExpiration: any
    name: string
    playlists: any[]
    queueItems: any[]
    subscribedPlaylistIds: any[]
    subscribedPodcastIds: any[]
    subscribedUserIds: any[]
  }
  statusCode: number | null
}

export default withRedux(initializeStore)(appWithTranslation(class MyApp extends App<Props> {

  static async getInitialProps({ Component, ctx }) {
    let statusCode: number | null = null

    try {
      await checkIfInMaintenanceMode()
    } catch (error) {
      if (error && error.response && error.response.status) {
        if (error.response.status === 503) {
          ctx.res.statusCode = 503
          statusCode = 503
          ctx.res.data = error.response.data
        }
      }
    }

    let pageProps = {} as any

    ctx.store.dispatch(pageIsLoading(true))

    let cookies = {}

    if (!checkIfLoadingOnFrontEnd() && ctx.query && ctx.query.login) {
      ctx.store.dispatch({
        type: actionTypes.MODALS_LOGIN_SHOW,
        payload: true
      })
    } else if (!checkIfLoadingOnFrontEnd() && ctx.query && ctx.query.forgotPassword) {
      ctx.store.dispatch({
        type: actionTypes.MODALS_FORGOT_PASSWORD_SHOW,
        payload: true
      })
    } else if (!checkIfLoadingOnFrontEnd() && ctx.query && ctx.query.resetPassword) {
      ctx.store.dispatch({
        type: actionTypes.MODALS_RESET_PASSWORD_SHOW,
        payload: true
      })
    } else if (!checkIfLoadingOnFrontEnd() && ctx.query && ctx.query.sendVerificationEmail) {
      ctx.store.dispatch({
        type: actionTypes.MODALS_SEND_VERIFICATION_EMAIL_SHOW,
        payload: true
      })
    }

    let isMobileDevice = null as boolean | null
    if (typeof window === 'object') {
      const md = new MobileDetect(window.navigator.userAgent)
      isMobileDevice = !!md.mobile()
    } else {
      const md = new MobileDetect(ctx.req.headers['user-agent'])
      isMobileDevice = !!md.mobile()
    }

    if (!checkIfLoadingOnFrontEnd() && ctx.req.headers.cookie) {
      const parsedCookie = cookie.parse(ctx.req.headers.cookie)

      if (parsedCookie[PV.cookies.uiTheme]) {
        ctx.store.dispatch({
          type: actionTypes.SETTINGS_SET_UI_THEME,
          payload: parsedCookie[PV.cookies.uiTheme]
        })
      }

      if (parsedCookie[PV.cookies.censorNSFWText]) {
        ctx.store.dispatch({
          type: actionTypes.SETTINGS_CENSOR_NSFW_TEXT,
          payload: parsedCookie[PV.cookies.censorNSFWText]
        })
      }

      if (parsedCookie[PV.cookies.playbackSpeedButtonHide]) {
        ctx.store.dispatch({
          type: actionTypes.SETTINGS_SET_HIDE_PLAYBACK_SPEED_BUTTON,
          payload: parsedCookie[PV.cookies.playbackSpeedButtonHide]
        })
      }

      if (parsedCookie[PV.cookies.defaultHomepageTab]) {
        ctx.store.dispatch({
          type: actionTypes.SETTINGS_SET_DEFAULT_HOMEPAGE_TAB,
          payload: parsedCookie[PV.cookies.defaultHomepageTab]
        })
      } else {
        ctx.store.dispatch({
          type: actionTypes.SETTINGS_SET_DEFAULT_HOMEPAGE_TAB,
          payload: 'last-visited'
        })
      }

      if (parsedCookie.Authorization) {
        try {
          const userInfo = await getAuthenticatedUserInfo(parsedCookie.Authorization)

          if (userInfo) {
            ctx.bearerToken = parsedCookie.Authorization

            ctx.store.dispatch({
              type: actionTypes.USER_SET_INFO,
              payload: {
                email: userInfo.email,
                emailVerified: userInfo.emailVerified,
                freeTrialExpiration: userInfo.freeTrialExpiration,
                historyItems: userInfo.historyItems,
                id: userInfo.id,
                isPublic: userInfo.isPublic,
                mediaRefs: userInfo.mediaRefs,
                membershipExpiration: userInfo.membershipExpiration,
                name: userInfo.name,
                playlists: userInfo.playlists,
                queueItems: userInfo.queueItems,
                subscribedPlaylistIds: userInfo.subscribedPlaylistIds,
                subscribedPodcastIds: userInfo.subscribedPodcastIds,
                subscribedUserIds: userInfo.subscribedUserIds
              }
            })
          }
        } catch (error) {
          // continue with unauthenticated user
        }
      }

      cookies = {
        showFreeTrialHasEnded: parsedCookie[PV.cookies.showFreeTrialHasEnded],
        showFreeTrialWarning: parsedCookie[PV.cookies.showFreeTrialWarning],
        showMembershipHasEnded: parsedCookie[PV.cookies.showMembershipHasEnded],
        showMembershipWarning: parsedCookie[PV.cookies.showMembershipWarning]
      }
    }

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    const { lastScrollPosition, newPlayingItem } = pageProps

    if (!checkIfLoadingOnFrontEnd() && newPlayingItem) {
      ctx.store.dispatch(mediaPlayerLoadNowPlayingItem(newPlayingItem))
    }

    if (checkIfLoadingOnFrontEnd() && lastScrollPosition) {
      setTimeout(() => {
        const el = document.querySelector('.view__contents')
        if (el) {
          el.scrollTop = lastScrollPosition
        }
      }, 0)
    } else if (checkIfLoadingOnFrontEnd()) {
      scrollToTopOfView()
    }

    return { pageProps, cookies, isMobileDevice, newPlayingItem, statusCode }
  }

  async componentDidMount() {
    let { newPlayingItem } = this.props
    const { store } = this.props
    const state = store.getState()
    const { user } = state

    // If page uses a query parameter to show a modal on page load,
    // then update history so the query parameter version is not last in history.
    const urlParams = new URLSearchParams(window.location.search)
    const paramLogin = urlParams.get(PV.queryParams.login)
    const paramForgotPassword = urlParams.get(PV.queryParams.forgotPassword)
    const paramResetPassword = urlParams.get(PV.queryParams.resetPassword)
    const paramSendVerificationEmail = urlParams.get(PV.queryParams.sendVerificationEmail)
    if (paramLogin || paramForgotPassword || paramResetPassword || paramSendVerificationEmail) {
      window.history.pushState({}, document.title, window.location.origin + window.location.pathname)
    }

    const isiOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent)
    if (isiOSWebView) {
      const view = document.querySelector('.view')
      if (view) {
        view.className = 'view ios-webview-polyfill'
      }
    }

    if (!windowHasLoaded) {
      disableHoverOnTouchDevices()

      let fixMobileViewportHeightCount = 0
      const fixMobileViewportHeightInterval = setInterval(() => {
        fixMobileViewportHeight()
        fixMobileViewportHeightCount++
        if (fixMobileViewportHeightCount >= 5) {
          clearInterval(fixMobileViewportHeightInterval)
        }
      }, 2000)

      if (newPlayingItem) {
        store.dispatch(mediaPlayerLoadNowPlayingItem(newPlayingItem))
        await setNowPlayingItem(newPlayingItem, newPlayingItem.userPlaybackPosition, user)
      } else {
        const currentItem = await getNowPlayingItem(user)
        if (currentItem) store.dispatch(mediaPlayerLoadNowPlayingItem(currentItem))
      }
    }

    const priorityItems = await getQueueItems(user)
    store.dispatch(playerQueueLoadPriorityItems(priorityItems))
    
    initializeMatomo()
    matomoTrackPageView()
    Router.events.on('routeChangeComplete', url => {
      matomoTrackPageView()
    })

    windowHasLoaded = true
    
    this.forceUpdate()

    refreshAllBrowserCookies()
  }

  render() {
    const { Component, cookies, isMobileDevice, pageProps, statusCode, store } = this.props
    const { pageKey } = pageProps
    const shouldHidePageContents = isMobileDevice === null

    return (
      <Provider store={store}>
        <Fragment>
          <Fragment>
            {
              statusCode === 503 && (
                <div className='view'>
                  <div className={`view__contents ${shouldHidePageContents ? 'hide' : ''}`}>
                    <div className='max-width top'>
                      <Error {...pageProps} statusCode={statusCode} />
                    </div>
                  </div>
                </div>
              ) 
            }
            {
              statusCode !== 503 && (
                <Fragment>
                  <PageLoadingOverlay />
                  <div className='view'>
                    <div className='view__navbar'>
                      <NavBar pageKey={pageKey} />
                    </div>
                    <div className={`view__contents ${shouldHidePageContents ? 'hide' : ''}`}>
                      <AppLinkWidget pageKey={pageKey} />
                      <div className='max-width top'>
                        <Alerts
                          cookies={cookies}
                          pageKey={pageKey} />
                        <Component {...pageProps} />
                      </div>
                      <div className='max-width bottom'>
                        <Footer
                          isMobileDevice={isMobileDevice}
                          pageKey={pageKey} />
                      </div>
                    </div>
                    <MediaPlayerView
                      {...pageProps}
                      isMobileDevice={isMobileDevice} />
                  </div>
                  <Auth />
                  <MediaModals />
                </Fragment>
              )
            }
          </Fragment>
        </Fragment>
      </Provider>
    )
  }
}))
