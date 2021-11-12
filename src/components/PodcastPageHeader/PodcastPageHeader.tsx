import type { Podcast } from 'podverse-shared'
import { useTranslation } from 'react-i18next'
import { generateAuthorText } from '~/lib/utility/author'
import { generateCategoryNodes } from '~/lib/utility/category'
import { PV } from '~/resources'
import { ButtonRectangle, PVImage } from '..'

type Props = {
  podcast: Podcast
}

export const PodcastPageHeader = ({ podcast }: Props) => {
  const { t } = useTranslation()
  const { imageUrl } = podcast
  const authorEls = generateAuthorText(podcast.authors)
  const categoryEls = generateCategoryNodes(podcast.categories)
  
  return (
    <div
      className='podcast-page-header'>
      <div className='main-max-width'>
        <PVImage
          alt={t('Podcast artwork')}
          height={PV.Images.sizes.large}
          src={imageUrl}
          width={PV.Images.sizes.large}
        />
        <div className='text-wrapper'>
          <h1>{podcast.title}</h1>
          <div className='sub-text'>
            {authorEls.length > 0 && authorEls}
            {authorEls.length > 0 && categoryEls.length > 0 && ' • '}
            {categoryEls.length > 0 && categoryEls}
          </div>
        </div>
        <ButtonRectangle
          label={t('Subscribe')}
          type='tertiary' />
      </div>
    </div>
  )
}
