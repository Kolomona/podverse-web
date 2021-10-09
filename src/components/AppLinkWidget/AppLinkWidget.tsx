/* eslint-disable jsx-a11y/anchor-has-content */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { Component } from 'react'
import * as Modal from 'react-modal'
import { connect } from 'react-redux'
import { Button, CloseButton } from 'podverse-ui'
import config from '~/config'
import PV from '~/lib/constants'
import { checkIfLoadingOnFrontEnd, getMobileOperatingSystem } from '~/lib/utility'
import { withTranslation } from 'i18n'
const { APP_DOWNLOAD_ON_THE_APP_STORE_URL, APP_GET_IT_ON_FDROID_URL,
  APP_GET_IT_ON_GOOGLE_PLAY_URL, APP_PROTOCOL } = config()

type Props = {
  pageKey: string
  t?: any
}

type State = {
  isValidMobileOS: boolean
  mobileOS: string
  modalIsOpen: boolean
}

const createDeepLink = (pageKey: string) => {
  pageKey = pageKey === 'home' ? 'podcasts' : pageKey

  if (pageKey) {
    // Split on only the first matching underscore,
    // because ids may contain underscores.
    // Note this adds an extra empty string in the last array position
    // if it finds an underscore.
    const pageKeys = pageKey.split(/_(.+)/)
    let path = ''
    if (pageKeys.length === 3) {
      path = pageKeys[0] + '/' + pageKeys[1]
    } else if (pageKeys.length === 1) {
      path = pageKeys[0]
    }

    return APP_PROTOCOL + path
  } else {
    return ''
  }
}

const createDownloadButton = (mobileOS: string, t) => {

  if (mobileOS === 'Android') {
    return (
      <React.Fragment>
        <a
          className='get-it-on-google-play no-radius'
          href={APP_GET_IT_ON_GOOGLE_PLAY_URL}
          rel='noopener noreferrer'
          target='_blank'>
          <img
            alt={t('GetItOnGooglePlay')}
            src={PV.paths.web.googlePlayStoreBadge}
          />
        </a>
        <br />
        <a
          className='get-it-on-fdroid no-radius'
          href={APP_GET_IT_ON_FDROID_URL}
          rel='noopener noreferrer'
          target='_blank' />
      </React.Fragment>
    )
  } else if (mobileOS === 'iOS') {
    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        className='download-on-the-app-store no-radius'
        href={APP_DOWNLOAD_ON_THE_APP_STORE_URL}
        rel='noopener noreferrer'
        target='_blank'
      />
    )
  } else {
    return null
  }
}

const customStyles = {
  content: {
    bottom: 'unset',
    left: '50%',
    maxWidth: '320px',
    overflow: 'unset',
    right: 'unset',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%'
  }
}

const deepLinkPages = [
  'clip_',
  'episode_',
  'home',
  'playlist_',
  'podcast_',
  'profile_'
]

class AppLinkWidget extends Component<Props, State> {

  constructor(props) {
    super(props)

    const mobileOS = getMobileOperatingSystem()
    const isValidMobileOS = mobileOS === 'Android' || mobileOS === 'iOS'

    this.state = {
      isValidMobileOS,
      mobileOS,
      modalIsOpen: false
    }
  }

  handleOpenInApp = () => {
    const { pageKey } = this.props
    const { mobileOS } = this.state
    const deepLink = createDeepLink(pageKey)

    if (mobileOS === 'Android') {
      window.location.href = deepLink
    } else if (mobileOS === 'iOS') {
      window.location.href = deepLink
    }
  }

  _handleHideModal = () => {
    this.setState({ modalIsOpen: false })
  }

  _handleShowModal = () => {
    this.setState({ modalIsOpen: true })
  }

  render() {
    const { pageKey = '', t } = this.props
    const { isValidMobileOS, mobileOS, modalIsOpen } = this.state
    const downloadButton = createDownloadButton(mobileOS, t)

    const isDeepLinkPage = pageKey && deepLinkPages.find((x) => pageKey.indexOf(x) >= 0)

    if (!isValidMobileOS || !isDeepLinkPage) return <div />

    let appEl
    if (checkIfLoadingOnFrontEnd()) {
      appEl = document.querySelector('body')
    }

    return (
      <div>
        <div className='app-link-widget max-width'>
          <Button
            className='app-link-widget__open-in-app'
            onClick={this._handleShowModal}
            outline={true}
            text={t('OpenInApp')} />
        </div>
        <Modal
          appElement={appEl}
          contentLabel={t('OpenInApp')}
          isOpen={modalIsOpen}
          onRequestClose={this._handleHideModal}
          portalClassName='open-in-the-app-modal over-media-player'
          shouldCloseOnOverlayClick
          style={customStyles}>
          <h3><FontAwesomeIcon icon='mobile-alt' /> &nbsp;{t('Mobile App')}</h3>
          <CloseButton onClick={this._handleHideModal} />
          <div className='open-in-the-app-modal__i-have-the-app-wrapper'>
            <Button
              className={`open-in-the-app-modal__i-have-the-app ${mobileOS}`}
              onClick={this.handleOpenInApp}
              outline={true}
              text={t('OpenInApp')} />
          </div>
          <div className='open-in-the-app-modal__download-app'>
            {downloadButton}
          </div>
        </Modal>
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(AppLinkWidget))
