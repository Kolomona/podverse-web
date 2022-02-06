import { faDiscord, faGithub, faMastodon, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faCopyright as faCopyrightRegular } from '@fortawesome/free-regular-svg-icons'
import { useTranslation } from 'react-i18next'
import { PV } from '~/resources'
import { Icon, NavBarBrand, PVLink } from '..'

export const Footer = () => {
  const { t } = useTranslation()

  const socialLinks = (
    <>
      <li>
        <a className='footer-social-link-github' href='https://github.com/podverse' target='_blank' rel='noreferrer'>
          <Icon faIcon={faGithub} />
        </a>
      </li>
      <li>
        <a className='footer-social-link-twitter' href='https://twitter.com/podverse' target='_blank' rel='noreferrer'>
          <Icon faIcon={faTwitter} />
        </a>
      </li>
      <li>
        <a className='footer-social-link-discord' href='https://discord.gg/6HkyNKR' target='_blank' rel='noreferrer'>
          <Icon faIcon={faDiscord} />
        </a>
      </li>
      <li>
        <a
          className='footer-social-link-mastodon'
          href='https://podcastindex.social/web/@podverse'
          target='_blank'
          rel='noreferrer'
        >
          <Icon faIcon={faMastodon} />
        </a>
      </li>
    </>
  )

  return (
    <footer className='footer'>
      <hr />
      <div className='footer-top'>
        <NavBarBrand height={28} href={PV.RoutePaths.web.home} src={PV.Images.dark.brandLogo} width={150} />
        <div className='open-source-license'>
          <a href='https://www.gnu.org/licenses/agpl-3.0.en.html' target='_blank' rel='noreferrer'>
            {t('open source')} <Icon faIcon={faCopyrightRegular} rotation={180} />
          </a>
        </div>
      </div>
      <div className='footer-middle'>
        <div className='footer-middle-site-links'>
          <ul>
            <li>
              <PVLink className='footer-link-contact' href='/contact'>
                {t('Contact')}
              </PVLink>
            </li>
            <li>
              <PVLink className='footer-link-about' href='/about'>
                {t('About')}
              </PVLink>
            </li>
            <li>
              <PVLink className='footer-link-terms' href='/terms'>
                {t('Terms')}
              </PVLink>
            </li>
            <li>
              <PVLink className='footer-link-premium' href='/membership'>
                {t('Premium')}
              </PVLink>
            </li>
          </ul>
          <ul className='footer-right-section hide-below-tablet-max-width'>{socialLinks}</ul>
        </div>
        <div className='footer-middle-site-links'>
          <ul>
            <li>
              <PVLink className='footer-link-mobile-app' href='/about'>
                {t('Mobile App')}
              </PVLink>
            </li>
            {/* <li>
              <PVLink href='/v4v-wallet'>V4V Wallet</PVLink>
            </li> */}
            <li>
              <PVLink className='footer-link-support' href='/support'>
                {t('Support')}
              </PVLink>
            </li>
          </ul>
          {/* <ul className='footer-right-section hide-below-tablet-max-width'>
            <li>
              <i className="pi pi-podcasting20certified"></i>
            </li>
          </ul> */}
        </div>
        <ul className='footer-mobile-section hide-above-tablet-xl-min-width'>{socialLinks}</ul>
        {/* <ul className='footer-mobile-section hide-above-tablet-xl-min-width'>
          <li>
            <i className="pi pi-podcasting20certified"></i>
          </li>
        </ul> */}
      </div>
    </footer>
  )
}
