import Link from 'next/link'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Meta from '~/components/Meta/Meta'
import config from '~/config'
import PV from '~/lib/constants'
import { alertRateLimitError } from '~/lib/utility'
import { modalsLoginShow, modalsSendVerificationEmailShow, pageIsLoading } from '~/redux/actions'
import { verifyEmail } from '~/services/auth'
import { withTranslation } from '~/../i18n'
const { PUBLIC_BASE_URL } = config()

type Props = {
  hasError?: string
  modalsLoginShow?: any
  modalsSendVerificationEmailShow?: any
  t?: any
}

type State = {}

class VerifyEmail extends Component<Props, State> {

  static async getInitialProps({ query, req, store }) {
    const token = query.token
    const namespacesRequired = PV.nexti18next.namespaces
    store.dispatch(pageIsLoading(false))
    let props = { namespacesRequired } as any

    try {
      await verifyEmail(token)
    } catch (error) {
      if (error && error.response && error.response.status === 429) {
        alertRateLimitError(error)
        return { namespacesRequired }
      } else {
        props = { ...props, hasError: true }
      }
    }

    return props
  }

  constructor(props) {
    super(props)

    this.state = {}
  }

  _showSendVerificationEmailModal = async () => {
    const { modalsSendVerificationEmailShow } = this.props
    modalsSendVerificationEmailShow(true)
  }

  render() {
    const { hasError, t } = this.props

    const meta = {
      currentUrl: PUBLIC_BASE_URL + PV.paths.web.verify_email,
      description: t('pages:verify_email._Description'),
      title: t('pages:verify_email._Title')
    }

    return (
      <Fragment>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={true}
          title={meta.title}
          twitterDescription={meta.description}
          twitterTitle={meta.title} />
        {
          !hasError &&
            <Fragment>
              <h3>{t('EmailVerified')}</h3>
              <p>{t('ThankYouForVerifying')}</p>
              <p className='font-bolder'>
                <Link as={PV.paths.web._login} href={PV.paths.web._login}>
                  <a>{t('Login')}</a>
                </Link>
              </p>
            </Fragment>
        }
        {
          hasError &&
            <Fragment>
              <h3>{t('EmailVerificationFailed')}</h3>
              <p>{t('EmailAlreadyVerifiedOrTokenExpired')}</p>
              <p>
                <a href='#' onClick={this._showSendVerificationEmailModal}>
                  {t('SendVerificationEmail')}
                </a>
              </p>
            </Fragment>
        }
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  modalsLoginShow: bindActionCreators(modalsLoginShow, dispatch),
  modalsSendVerificationEmailShow: bindActionCreators(modalsSendVerificationEmailShow, dispatch)
})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(VerifyEmail))
