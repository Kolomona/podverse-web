import './addToPlaylist/actions'
import './checkout/actions'
import './forgotPassword/actions'
import './login/actions'
import './loginToAlert/actions'
import './signUp/actions'
import './verifyEmail/actions'

import OmniAural from 'omniaural'

const modalsHideAll = () => {
  OmniAural.modalsAddToPlaylistHide()
  OmniAural.modalsCheckoutHide()
  OmniAural.modalsForgotPasswordHide()
  OmniAural.modalsLoginHide()
  OmniAural.modalsLoginToAlertHide()
  OmniAural.modalsSignUpHide()
  OmniAural.modalsVerifyEmailHide()
}

OmniAural.addActions({ modalsHideAll })
