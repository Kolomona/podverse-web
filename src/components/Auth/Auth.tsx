import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { ForgotPasswordModal, LoginModal, SignUpModal } from 'podverse-ui'
import PV from '~/lib/constants'
import { modalsForgotPasswordIsLoading, modalsForgotPasswordShow, modalsForgotPasswordSetErrorResponse,
  modalsLoginIsLoading, modalsLoginShow, modalsSendVerificationEmailShow, modalsLoginSetErrorResponse,
  modalsSignUpIsLoading, modalsSignUpShow, modalsSignUpSetErrorResponse, userSetInfo,
  playerQueueLoadPriorityItems } from '~/redux/actions'
import { login, sendResetPassword, signUp, sendVerification } from '~/services/auth'
import { alertRateLimitError } from '~/lib/utility';
import { withTranslation } from 'i18n';

type Props = {
  modals?: any
  modalsForgotPasswordIsLoading?: any
  modalsForgotPasswordSetErrorResponse?: any
  modalsForgotPasswordShow?: any
  modalsLoginIsLoading?: any
  modalsLoginSetErrorResponse?: any
  modalsLoginShow?: any
  modalsSendVerificationEmailShow?: any
  modalsSignUpIsLoading?: any
  modalsSignUpSetErrorResponse?: any
  modalsSignUpShow?: any
  playerQueueLoadPriorityItems?: any
  t?: any
  user?: any
  userSetInfo?: any
}

type State = {
  signUpFinished?: boolean
}

class Auth extends Component<Props, State> {

  constructor(props) {
    super(props)
    this.state = {}
  }

  handleForgotPasswordSubmit = async email => {
    const { modalsForgotPasswordIsLoading, modalsForgotPasswordSetErrorResponse,
      modalsForgotPasswordShow, t } = this.props
    modalsForgotPasswordIsLoading(true)

    try {
      await sendResetPassword(email)
      modalsForgotPasswordShow(false)
      modalsForgotPasswordSetErrorResponse(null)
    } catch (error) {
      if (error && error.response && error.response.status === 429) {
        alertRateLimitError(error)
      } else {
        const errorMsg = (error.response && error.response.data && error.response.data.message) || t('errorMessages:internetConnectivityErrorMessage')
        modalsForgotPasswordSetErrorResponse(errorMsg)
      }
    } finally {
      modalsForgotPasswordIsLoading(false)
    }
  }


  handleSendVerificationEmailSubmit = async email => {
    const { modalsForgotPasswordIsLoading, modalsForgotPasswordSetErrorResponse,
      modalsSendVerificationEmailShow, t } = this.props
    modalsForgotPasswordIsLoading(true)

    try {
      await sendVerification(email)
      modalsSendVerificationEmailShow(false)
      modalsForgotPasswordSetErrorResponse(null)
    } catch (error) {
      console.log(PV.cookies.handleSendVerificationEmailSubmit, error)
      if (error && error.response && error.response.status === 429) {
        alertRateLimitError(error)
      } else {
        const errorMsg = (error.response && error.response.data && error.response.data.message) || t('errorMessages:internetConnectivityErrorMessage')
        modalsForgotPasswordSetErrorResponse(errorMsg)
      }
    } finally {
      modalsForgotPasswordIsLoading(false)
    }
  }

  handleLogin = async (email, password) => {
    const { modalsLoginIsLoading, modalsLoginSetErrorResponse, t, userSetInfo } = this.props
    modalsLoginIsLoading(true)
    
    try {
      await login(email, password)
      window.location.reload()
    } catch (error) {
      const pleaseVerifyMessage = (
        <Fragment>
          <p>{t('PleaseVerifyEmail')}</p>
                <span><a href='#' onClick={this._showSendVerificationEmailModal}>{t('SendVerificationEmail')}</a></span>
        </Fragment>
      )
      const errorMsg =
        (error.response && error.response.status === 460 && pleaseVerifyMessage) ||
        (error.response && error.response.data && error.response.data.message)
        || t('errorMessages:internetConnectivityErrorMessage')
      modalsLoginSetErrorResponse(errorMsg)
      modalsLoginIsLoading(false)
      userSetInfo({
        email: null,
        emailVerified: null,
        freeTrialExpiration: null,
        historyItems: [],
        id: null,
        isPublic: null,
        mediaRefs: [],
        membershipExpiration: null,
        name: null,
        playlists: [],
        queueItems: [],
        subscribedPlaylistIds: [],
        subscribedPodcastIds: [],
        subscribedUserIds: []
      })
    }
  }

  handleSignUp = async (email, password) => {
    const { modalsSignUpIsLoading, modalsSignUpSetErrorResponse, t, userSetInfo } = this.props
    modalsSignUpIsLoading(true)

    try {
      await signUp(email, password)
      this.setState({ signUpFinished: true })
    } catch (error) {
      if (error && error.response && error.response.status === 429) {
        alertRateLimitError(error)
      } else {
        const errorMsg = (error.response && error.response.data && error.response.data.message) || t('errorMessages:internetConnectivityErrorMessage')
        modalsSignUpSetErrorResponse(errorMsg)
      }
      userSetInfo({
        historyItems: [],
        id: null,
        isPublic: null,
        name: null,
        mediaRefs: [],
        playlists: [],
        queueItems: [],
        subscribedPodcastIds: [],
        subscribedUserIds: []
      })
    } finally {
      modalsSignUpIsLoading(false)
    }
  }

  _showSendVerificationEmailModal = async () => {
    const { modalsSendVerificationEmailShow } = this.props
    modalsSendVerificationEmailShow(true)
  }

  render() {
    const { modals, modalsForgotPasswordShow, modalsLoginShow, modalsSignUpShow, t
      } = this.props
    const { forgotPassword, login, signUp } = modals
    const { signUpFinished } = this.state

    const signUpTopText = (
      <React.Fragment>
        <p style={{ textAlign: 'center' }}>
          {t('Try premium free for 1 year!')}
          <br />
          {t('$10 per year after that')}
        </p>
      </React.Fragment>
    )

    return (
      <React.Fragment>
        <ForgotPasswordModal
          errorResponse={forgotPassword.errorResponse}
          handleSubmit={modals.forgotPassword && modals.forgotPassword.isSendVerificationEmail ?
            this.handleSendVerificationEmailSubmit : this.handleForgotPasswordSubmit}
          hideModal={() => modalsForgotPasswordShow(false)}
          isLoading={modals.forgotPassword && modals.forgotPassword.isLoading}
          isOpen={(modals.forgotPassword && modals.forgotPassword.isOpen)}
          isResetPassword={modals.forgotPassword && modals.forgotPassword.isResetPassword}
          isSendVerificationEmail={modals.forgotPassword && modals.forgotPassword.isSendVerificationEmail}
          t={t} />
        <LoginModal
          errorResponse={login.errorResponse}
          handleLogin={this.handleLogin}
          hideModal={() => modalsLoginShow(false)}
          isLoading={modals.login && modals.login.isLoading}
          isOpen={modals.login && modals.login.isOpen}
          showForgotPasswordModal={() => modalsForgotPasswordShow(true)}
          showSignUpModal={() => modalsSignUpShow(true)}
          t={t} />
        <SignUpModal
          errorResponse={signUp.errorResponse}
          handleSignUp={this.handleSignUp}
          hideModal={() => {
            this.setState({ signUpFinished: false })
            modalsSignUpShow(false)
          }}
          isLoading={modals.signUp && modals.signUp.isLoading}
          isOpen={modals.signUp && modals.signUp.isOpen}
          signUpFinished={signUpFinished}
          t={t}
          topText={signUpTopText} />
      </React.Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  modalsForgotPasswordIsLoading: bindActionCreators(modalsForgotPasswordIsLoading, dispatch),
  modalsForgotPasswordShow: bindActionCreators(modalsForgotPasswordShow, dispatch),
  modalsForgotPasswordSetErrorResponse: bindActionCreators(modalsForgotPasswordSetErrorResponse, dispatch),
  modalsLoginIsLoading: bindActionCreators(modalsLoginIsLoading, dispatch),
  modalsLoginShow: bindActionCreators(modalsLoginShow, dispatch),
  modalsLoginSetErrorResponse: bindActionCreators(modalsLoginSetErrorResponse, dispatch),
  modalsSendVerificationEmailShow: bindActionCreators(modalsSendVerificationEmailShow, dispatch),
  modalsSignUpIsLoading: bindActionCreators(modalsSignUpIsLoading, dispatch),
  modalsSignUpShow: bindActionCreators(modalsSignUpShow, dispatch),
  modalsSignUpSetErrorResponse: bindActionCreators(modalsSignUpSetErrorResponse, dispatch),
  playerQueueLoadPriorityItems: bindActionCreators(playerQueueLoadPriorityItems, dispatch),
  userSetInfo: bindActionCreators(userSetInfo, dispatch)
})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(Auth))
