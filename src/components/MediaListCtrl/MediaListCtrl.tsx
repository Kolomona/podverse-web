
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { convertToNowPlayingItem } from 'podverse-shared'
import { FilterCtrl, MediaListSelect, Pagination } from 'podverse-ui'
import MediaListItemCtrl from '~/components/MediaListItemCtrl/MediaListItemCtrl'
import config from '~/config'
import PV from '~/lib/constants'
import { addOrUpdateHistoryItemAndState, cookieSetQuery } from '~/lib/utility'
import { mediaPlayerLoadNowPlayingItem, mediaPlayerUpdatePlaying, pageIsLoading,
  playerQueueLoadPriorityItems, userSetInfo } from '~/redux/actions'
import { getEpisodesByQuery, getMediaRefsByQuery, retrieveLatestChaptersForEpisodeId,
  setNowPlayingItem } from '~/services'
import { withTranslation } from '~/../i18n'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
const uuidv4 = require('uuid/v4')
const { CATEGORY_ID_DEFAULT, QUERY_MEDIA_REFS_LIMIT } = config()

type Props = {
  allCategories?: any
  categoryId?: string
  currentId?: string
  episode?: any
  episodeId?: string
  handleSetPageQueryState: Function
  includeMostRecent?: boolean
  includeOldest?: boolean
  mediaPlayer?: any
  mediaPlayerLoadNowPlayingItem?: any
  mediaPlayerUpdatePlaying?: any
  pageIsLoading?: any
  pageKey: string
  page?: any
  pages?: any
  podcast?: any
  podcastId?: string
  queryFrom?: string
  queryPage: number
  querySort?: string
  queryType?: string
  settings?: any
  showQueryTypeSelect?: boolean
  t?: any
  user?: any
  userSetInfo?: any
}

type State = {
  listItemNodes: any[]
}

class MediaListCtrl extends Component<Props, State> {

  static defaultProps: Props = {
    handleSetPageQueryState: () => {},
    pageKey: 'default',
    queryPage: 1
  }

  constructor(props) {
    super(props)
    const { pageKey, pages } = props
    const { listItems } = pages[pageKey]
    const listItemNodes = this.createListItemNodes(listItems)
    this.state = {
      listItemNodes
    }
  }

  queryListItems = async (queryType, queryFrom, querySort, page, categoryId) => {
    const { episode, episodeId, handleSetPageQueryState, pageIsLoading,
      pageKey, pages, podcast, podcastId, user } = this.props
    const { subscribedPodcastIds } = user
    const { filterText } = pages[pageKey]

    if (
      queryType === PV.queryParams.episodes
      && (queryFrom === PV.queryParams.all_podcasts || queryFrom === PV.queryParams.from_category)
      && querySort === PV.queryParams.most_recent
    ) {
      querySort = PV.queryParams.top_past_week
    }

    this.setTemporaryMinHeightOnMediaList()
   
    const query: any = {
      page,
      from: queryFrom,
      sort: querySort,
      episodeId: queryFrom === PV.queryParams.from_episode ? episodeId : null,
      podcastId: queryFrom === PV.queryParams.from_podcast ? podcastId : null,
      categories: categoryId,
      ...(filterText ? { searchAllFieldsText: filterText } : {}),
      ...(queryFrom === PV.queryParams.all_podcasts ||
          queryFrom === PV.queryParams.subscribed_only ? { includePodcast: true } : {}),
      ...(queryFrom === PV.queryParams.from_podcast ? { includeEpisode: true } : {})
    }

    cookieSetQuery(pageKey, queryFrom, queryType, querySort, categoryId)

    const newState: any = {
      pageKey,
      queryPage: page,
      queryType,
      queryFrom,
      querySort,
      categoryId,
      selected: queryFrom
    }
    pageIsLoading(true)

    handleSetPageQueryState({
      pageKey,
      queryType,
      queryFrom,
      querySort,
      ...(page <= 1 ? { listItems: []} : {}),
      categoryId,
      selected: queryFrom
    })

    if (queryFrom === PV.queryParams.from_podcast) {
      query.podcastId = podcastId
    } else if (queryFrom === PV.queryParams.subscribed_only) {
      if (subscribedPodcastIds && subscribedPodcastIds.length > 0) {
        query.podcastId = subscribedPodcastIds
      } else {
        this.handleSetPageQueryStateListItems(newState, [], 0)
        pageIsLoading(false)
        return
      }
    }

    try {
      let nowPlayingItems = []
      let listItemsTotal

      if (queryType === PV.queryParams.chapters && (episode && episode.id || episodeId)) {
        const response = await retrieveLatestChaptersForEpisodeId(episodeId || episode.id)
        const chapters = response.data
        listItemsTotal = chapters[1]
        nowPlayingItems = chapters[0].map(x => convertToNowPlayingItem(x, episode, podcast))
      } else if (queryType === PV.queryParams.episodes) {
        const response = await getEpisodesByQuery(query)
        const episodes = response.data
        listItemsTotal = episodes[1]
        nowPlayingItems = episodes[0].map(x => convertToNowPlayingItem(x, episode, podcast))
      } else {
        const response = await getMediaRefsByQuery(query)
        const mediaRefs = response.data
        listItemsTotal = mediaRefs[1]
        nowPlayingItems = mediaRefs[0].map(x => convertToNowPlayingItem(x, episode, podcast))
      }

      this.handleSetPageQueryStateListItems(newState, nowPlayingItems, listItemsTotal)
    } catch (error) {
      console.log(error)
      this.handleSetPageQueryStateListItems(newState, [], 0)
    }

    pageIsLoading(false)

    this.clearTemporaryMinHeightOnMediaList()
  }

  querySort = async selectedValue => {
    const { pageKey, pages } = this.props
    const { categoryId, queryFrom, queryType } = pages[pageKey]
    await this.queryListItems(queryType, queryFrom, selectedValue, 1, categoryId)
  }

  setTemporaryMinHeightOnMediaList = () => {
    const mediaListEl = document.querySelector('.media-list') as any
    if (mediaListEl && mediaListEl.clientHeight > 0) {
      mediaListEl.style.minHeight = `${mediaListEl.clientHeight}px`
    }
  }

  clearTemporaryMinHeightOnMediaList = () => {
    const mediaListEl = document.querySelector('.media-list') as any
    if (mediaListEl) {
      mediaListEl.style.minHeight = 'unset'
    }
  }

  getQueryTypeOptions = () => {
    const { pageKey, pages, podcastId, t } = this.props
    const { categoryId, queryFrom, querySort } = pages[pageKey]
    const options = [] as any
    const pageKeyPrefix = pageKey.split('_')[0]

    const includeChapters = [PV.pageKeys.clip, PV.pageKeys.episode].includes(pageKeyPrefix + '_')
    if (includeChapters) {
      options.push({
        label: t('Chapters'),
        onClick: () => this.queryListItems(PV.queryParams.chapters, queryFrom, querySort, 1, categoryId),
        value: PV.queryParams.chapters
      })
    }

    options.push(
      {
        label: t('Clips'),
        onClick: () => this.queryListItems(PV.queryParams.clips, queryFrom, querySort, 1, categoryId),
        value: PV.queryParams.clips,
      }
    )

    const includeEpisodes = [PV.pageKeys.clips, PV.pageKeys.episodes].includes(pageKeyPrefix)
      || [PV.pageKeys.podcast].includes(pageKeyPrefix + '_')
    if (includeEpisodes) {
      options.push(
        {
          label: t('Episodes'),
          onClick: () => this.queryListItems(
            PV.queryParams.episodes,
            podcastId ? PV.queryParams.from_podcast : queryFrom,
            querySort,
            1,
            categoryId
          ),
          value: PV.queryParams.episodes,
        }
      )
    }
    
    return options
  }

  getQueryFromOptions = (showFromPodcast, showFromEpisode) => {
    const { pageKey, pages, t } = this.props
    const { querySort, queryType } = pages[pageKey]

    const options = [] as any

    if (showFromPodcast) {
      options.unshift(
        {
          label: t('queryLabels:FromThisPodcast'),
          onClick: () => this.queryListItems(queryType, PV.queryParams.from_podcast, querySort, 1, null),
          value: PV.queryParams.from_podcast
        }
      )
    }

    if (showFromEpisode) {
      options.unshift(
        {
          label: t('queryLabels:FromThisEpisode'),
          onClick: () => this.queryListItems(queryType, PV.queryParams.from_episode, querySort, 1, null),
          value: PV.queryParams.from_episode
        }
      )
    }

    return options
  }

  getQuerySortOptions(includeOldest?: boolean, showChronological?: boolean) {
    const { pageKey, pages, t } = this.props
    const { queryFrom, queryType } = pages[pageKey]
    const items = [] as any

    const includeAllSortOptions = (
      !(queryType === PV.queryParams.episodes && queryFrom === PV.queryParams.from_category)
      && !(queryType === PV.queryParams.episodes && queryFrom === PV.queryParams.all_podcasts)
    )

    if (queryType !== PV.queryParams.chapters) {
      if (includeAllSortOptions) {
        items.push({
          label: t('queryLabels:most_recent'),
          onClick: () => this.querySort(PV.queryParams.most_recent),
          value: PV.queryParams.most_recent
        })
      }

      items.push({
        label: t('queryLabels:top_past_day'),
        onClick: () => this.querySort(PV.queryParams.top_past_day),
        value: PV.queryParams.top_past_day
      })
      items.push({
        label: t('queryLabels:top_past_week'),
        onClick: () => this.querySort(PV.queryParams.top_past_week),
        value: PV.queryParams.top_past_week
      })
      items.push({
        label: t('queryLabels:top_past_month'),
        onClick: () => this.querySort(PV.queryParams.top_past_month),
        value: PV.queryParams.top_past_month
      })
      items.push({
        label: t('queryLabels:top_past_year'),
        onClick: () => this.querySort(PV.queryParams.top_past_year),
        value: PV.queryParams.top_past_year
      })
      items.push({
        label: t('queryLabels:top_all_time'),
        onClick: () => this.querySort(PV.queryParams.top_all_time),
        value: PV.queryParams.top_all_time
      })

      if (includeAllSortOptions) {
        items.push({
          label: t('queryLabels:random'),
          onClick: () => this.querySort(PV.queryParams.random),
          value: PV.queryParams.random
        })
      }
    }

    if (showChronological) {
      items.unshift({
        label: PV.queryParams.chronological,
        onClick: () => this.querySort(PV.queryParams.chronological),
        value: PV.queryParams.chronological
      })
    }

    if (includeOldest) {
      items.splice(1, 0, {
        label: PV.queryParams.oldest,
        onClick: () => this.querySort(PV.queryParams.oldest),
        value: PV.queryParams.oldest
      })
    }

    return items
  }

  playItem = async nowPlayingItem => {
    const { mediaPlayer, mediaPlayerLoadNowPlayingItem, mediaPlayerUpdatePlaying,
      pageKey, pages, user, userSetInfo } = this.props
    const { podcast } = pages[pageKey]
    const { nowPlayingItem: previousItem } = mediaPlayer

    if (window.player) {
      const currentTime = Math.floor(window.player.getCurrentTime()) || 0
      await addOrUpdateHistoryItemAndState(mediaPlayer.nowPlayingItem, user, currentTime)
    }

    // If loading a new episode, clear the player to prevent the error:
    // TypeError: Failed to set the 'currentTime' property on 'HTMLMediaElement': The provided double value is non-finite.
    // I don't know why this is happening because everywhere I am setting player.seekTo
    // the value should be wrapped in a Math.floor().
    // I also don't understand why this issue happens only for new episodes, but not new clips :(
    if (nowPlayingItem 
        && previousItem 
        && !nowPlayingItem.clipStartTime
        && nowPlayingItem.episodeId !== previousItem.episodeId) {
      window.player = null
    }

    // If podcast data is not a part of the nowPlayingItem, then user must be
    // using the 'From this podcast' filter on the podcast, episode, or clip page,
    // and we will need to enrich the nowPlayingItem with the podcast data.
    if (!nowPlayingItem.podcastId && podcast) {
      nowPlayingItem.podcastId = podcast.id
      nowPlayingItem.podcastShrunkImageUrl = podcast.shrunkImageUrl
      nowPlayingItem.podcastTitle = podcast.title
      nowPlayingItem.podcastFunding = podcast.funding
      nowPlayingItem.podcastValue = podcast.value
    }

    mediaPlayerLoadNowPlayingItem(nowPlayingItem)
    await setNowPlayingItem(nowPlayingItem, nowPlayingItem.userPlaybackPosition, user)
    mediaPlayerUpdatePlaying(true)

    if (user && user.id) {
      const historyItems = await addOrUpdateHistoryItemAndState(nowPlayingItem, user)
      userSetInfo({ historyItems })
    }
  }

  filterTextQuery = async (filterText) => {
    const { episodeId, handleSetPageQueryState, pageIsLoading, pageKey, pages, podcastId, user } = this.props
    const { categoryId, queryFrom, querySort, queryType } = pages[pageKey]
    const { subscribedPodcastIds } = user

    pageIsLoading(true)
    handleSetPageQueryState({
      pageKey,
      filterText
    })

    let pId
    if (queryFrom === PV.queryParams.from_podcast) {
      pId = podcastId
    } else if (queryFrom === PV.queryParams.subscribed_only) {
      pId = subscribedPodcastIds && subscribedPodcastIds.length > 0 ? subscribedPodcastIds : [PV.queryParams.no_results]
    }

    const query: any = {
      page: 1,
      from: queryFrom,
      sort: querySort,
      categories: categoryId || (queryFrom === PV.queryParams.from_category ? CATEGORY_ID_DEFAULT : null),
      episodeId: queryFrom === PV.queryParams.from_episode ? episodeId : null,
      podcastId: pId || null,
      searchAllFieldsText: filterText,
      includePodcast: !!filterText || queryFrom === PV.queryParams.subscribed_only || queryFrom === PV.queryParams.all_podcasts
    }

    try {
      let nowPlayingItems
      let listItemsTotal

      if (queryType === PV.queryParams.chapters) {
        nowPlayingItems = []
        listItemsTotal = 0
      } else if (queryType === PV.queryParams.episodes) {
        const response = await getEpisodesByQuery(query)
        const episodes = response.data
        nowPlayingItems = episodes[0].map(x => convertToNowPlayingItem(x))
        listItemsTotal = episodes[1]
      } else {
        const response = await getMediaRefsByQuery(query)
        const mediaRefs = response.data
        nowPlayingItems = mediaRefs[0].map(x => convertToNowPlayingItem(x))
        listItemsTotal = mediaRefs[1]
      }

      this.handleSetPageQueryStateListItems({ pageKey }, nowPlayingItems, listItemsTotal)
    } catch (error) {
      console.log(error)
      this.handleSetPageQueryStateListItems({ pageKey }, [], 0)
    }

    pageIsLoading(false)
  }

  debouncedFilterQuery = AwesomeDebouncePromise(this.filterTextQuery, 750)

  handleSetPageQueryStateListItems = (newState, listItems, listItemsTotal) => {
    const { handleSetPageQueryState } = this.props

    handleSetPageQueryState({
      ...newState,
      listItems,
      listItemsTotal
    })
    const listItemNodes = this.createListItemNodes(listItems)
    this.setState({ listItemNodes })
  }

  createListItemNodes = (listItems) => {
    const { mediaPlayer, t } = this.props
    const { nowPlayingItem: mpNowPlayingItem } = mediaPlayer
    const { pageKey, pages } = this.props
    const { queryFrom, queryType } = pages[pageKey]

    let mediaListItemType = PV.attributes.mediaListItem.now_playing_item
    if (queryType === PV.queryParams.episodes) {
      if (queryFrom === PV.queryParams.from_podcast) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_episode_from_podcast
      } else if (queryFrom === PV.queryParams.all_podcasts) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_episode_from_all_podcasts
      }
    } else {
      if (queryType === PV.queryParams.chapters || queryFrom === PV.queryParams.from_episode) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_clip_from_episode
      } else if (queryFrom === PV.queryParams.from_podcast) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_clip_from_podcast
      }
    }

    return listItems.map(x => {
      const isActive = () => {
        if (mpNowPlayingItem) {
          if (x.clipId) {
            return x.clipId === mpNowPlayingItem.clipId
          } else if (x.episodeId) {
            return x.episodeId === mpNowPlayingItem.episodeId
          }
        }

        return false
      }

      return (
        <MediaListItemCtrl
          handlePlayItem={this.playItem}
          key={`media-list-item-${uuidv4()}`}
          isActive={isActive()}
          mediaListItemType={mediaListItemType}
          nowPlayingItem={x}
          pageKey={pageKey}
          showMoreMenu={true}
          t={t} />
      )
    })
  }

  handleFilterTextChange = async event => {
    const filterText = event.target.value
    this.debouncedFilterQuery(filterText)
  }

  clearFilterText = async () => {
    const { pageIsLoading } = this.props
    pageIsLoading(true)
    this.handleFilterTextChange({
      target: {
        value: ''
      }
    })
  }

  generateTopLevelSelectNodes = () => {
    const { pageKey, pages, t } = this.props
    const { categoryId, queryFrom, queryType, querySort } = pages[pageKey]
    const topLevelItems = [] as any[]

    topLevelItems.push({
      label: t('queryLabels:Subscribed'),
      onClick: () => this.queryListItems(queryType, PV.queryParams.subscribed_only, querySort, 1, categoryId),
      parentValue: null,
      value: PV.queryParams.subscribed_only
    })

    topLevelItems.push({
      label: t('queryLabels:AllPodcasts'),
      onClick: () => this.queryListItems(queryType, PV.queryParams.all_podcasts, querySort, 1, categoryId),
      parentValue: null,
      value: PV.queryParams.all_podcasts
    })

    topLevelItems.push({
      label: t('queryLabels:Categories'),
      onClick: () => this.queryListItems(queryType, PV.queryParams.from_category, querySort, 1, categoryId),
      parentValue: null,
      value: PV.queryParams.from_category
    })

    return (
      <MediaListSelect
        items={topLevelItems}
        key='top-level-select'
        selected={queryFrom} />
    )
  }

  generateCategorySelectNodes = (selectedCategoryId) => {
    const { allCategories, pageKey, pages, t } = this.props
    const { queryType, queryFrom, querySort, selected } = pages[pageKey]

    const categoryItems = allCategories.map(x => {
      return {
        hasSubcategories: x.categories && x.categories.length > 0,
        label: x.title,
        onClick: () => this.queryListItems(queryType, PV.queryParams.from_category, querySort, 1, x.id),
        parentValue: (x.category && x.category.id) || null,
        value: x.id
      }
    })

    const categorySelectNodes: any[] = []
    const selectedCategory = categoryItems.find(x => x.value === selectedCategoryId)

    if (selectedCategory) {
      const topLevelCategoryItems = categoryItems.filter(x => x.parentValue === null)

      let subcategoryItems: any[] = []
      if (selectedCategory.parentValue) {
        subcategoryItems = categoryItems.filter(x => x.parentValue === selectedCategory.parentValue)
      } else {
        subcategoryItems = categoryItems.filter(x => x.parentValue === selectedCategory.value)
      }

      subcategoryItems.unshift({
        label: t('queryLabels:AllPodcasts'),
        onClick: () => this.queryListItems(queryType, queryFrom, querySort, 1, selectedCategory.parentValue),
        parentValue: null,
        value: selectedCategory.parentValue
      })

      // If it is a top-level category with sub-categories
      if (selectedCategory.hasSubcategories) {
        categorySelectNodes.push(
          <MediaListSelect
            items={topLevelCategoryItems}
            key='category-select-1'
            selected={selectedCategory.value} />
        )
        categorySelectNodes.push(
          <MediaListSelect
            items={subcategoryItems}
            key='category-select-2' />
        )
      }
      // Else if it is a sub-category
      else if (selectedCategory.parentValue) {
        const topLevelCategoryItems = categoryItems.filter(x => x.parentValue === null)

        categorySelectNodes.push(
          <MediaListSelect
            items={topLevelCategoryItems}
            key='category-select-3'
            selected={selectedCategory.parentValue} />
        )

        categorySelectNodes.push(
          <MediaListSelect
            items={subcategoryItems}
            key='category-select-4'
            selected={selectedCategory.value} />
        )
      }
      // Else it is a top-level category without sub-categories
      else {
        categorySelectNodes.push(
          <MediaListSelect
            items={topLevelCategoryItems}
            key='category-select-5'
            selected={selectedCategory.value} />
        )
      }
    } else {
      const topLevelCategoryItems = categoryItems.filter(x => x.parentValue === null)
      categorySelectNodes.push(
        <MediaListSelect
          items={topLevelCategoryItems}
          key='category-select-6'
          selected={selected} />
      )
    }

    return categorySelectNodes
  }

  handleQueryPage = async page => {
    const { pageIsLoading, pageKey, pages } = this.props
    const { categoryId, queryFrom, querySort, queryType } = pages[pageKey]
    pageIsLoading(true)

    await this.queryListItems(
      queryType,
      queryFrom,
      querySort,
      page,
      categoryId
    )
    
    pageIsLoading(false)

    const mediaListSelectsEl = document.querySelector('.media-list__selects')
    if (mediaListSelectsEl) {
      mediaListSelectsEl.scrollIntoView()
    }
  }

  render() {
    const { episodeId, includeOldest, page, pageKey, pages,
      podcastId, showQueryTypeSelect, t, user } = this.props
    const { isLoading } = page
    const { categoryId, filterText, isAdvancedFilterShowing, listItemsTotal,
      queryFrom, queryPage, querySort, queryType } = pages[pageKey]
    const { listItemNodes } = this.state

    const selectedQueryTypeOption = this.getQueryTypeOptions().filter(x => x.value === queryType)

    const includeFromPodcast = !!podcastId && queryType !== PV.queryParams.chapters
    const includeFromEpisode = !!episodeId && (queryType === PV.queryParams.clips || queryType === PV.queryParams.chapters)
    const selectedQueryFromOption = this.getQueryFromOptions(includeFromPodcast, includeFromEpisode).filter(x => x.value === queryFrom)
    const sortOptions = this.getQuerySortOptions(
      includeOldest,
      (!!episodeId && queryType === PV.queryParams.clips && queryFrom === PV.queryParams.from_episode)
      || queryType === PV.queryParams.chapters
    )

    const selectedQuerySortOption = sortOptions.filter(x => x.value === querySort)
    const isNotLoggedInOnSubscribedOnly = (!user || !user.id) && queryFrom === PV.queryParams.subscribed_only

    let noResultsItemTypeMsg = t('No episodes found')
    if (queryType === PV.queryParams.clips) {
      noResultsItemTypeMsg = t('No clips found')
    } else if (queryType === PV.queryParams.chapters) {
      noResultsItemTypeMsg = (
        <>
          <div>
            {t('No chapters found')}
          </div>
          <div className='no-results-msg__sub-message'>
            {t('Chapters are officially created by the podcast')}
          </div>
        </>
      )
    }

    const noResultsFoundMsg = isNotLoggedInOnSubscribedOnly ? t('errorMessages:login.ViewYourSubscriptions') : noResultsItemTypeMsg

    return (
      <div className={`media-list`}>
        <div className='media-list__selects'>
          <div className='media-list-selects__left'>
            {
              showQueryTypeSelect &&
                <MediaListSelect
                  items={this.getQueryTypeOptions()}
                  selected={selectedQueryTypeOption.length > 0 ? selectedQueryTypeOption[0].value : null} />
            }
            {
              (podcastId || episodeId) ?
                <MediaListSelect
                  items={this.getQueryFromOptions(includeFromPodcast, includeFromEpisode)}
                  selected={selectedQueryFromOption.length > 0 ? selectedQueryFromOption[0].value : null} />
                :
                this.generateTopLevelSelectNodes()}
          </div>
          <div className='media-list-selects__right'>
            <MediaListSelect
              className='align-right'
              items={sortOptions}
              selected={selectedQuerySortOption.length > 0 ? selectedQuerySortOption[0].value : null} />
          </div>
        </div>
        <div className='media-list__selects'>
          <div className='media-list-selects__inline'>
            {queryFrom === PV.queryParams.from_category && !podcastId && !episodeId && this.generateCategorySelectNodes(categoryId)}
          </div>
        </div>
        <FilterCtrl
          clearFilterText={this.clearFilterText}
          filterText={filterText}
          handleFilterTextChange={this.handleFilterTextChange}
          hide={!isAdvancedFilterShowing}
          t={t} />
        <Fragment>
          {
            listItemNodes && listItemNodes.length > 0 &&
            <Fragment>
              {listItemNodes}
              {
                queryType !== PV.queryParams.chapters &&
                  <Pagination
                    currentPage={queryPage || 1}
                    handleQueryPage={this.handleQueryPage}
                    pageRange={2}
                    t={t}
                    totalPages={Math.ceil(listItemsTotal / QUERY_MEDIA_REFS_LIMIT)} />
              }
            </Fragment>
          }
          {
            (!isLoading && queryPage === 1 && listItemNodes && listItemNodes.length === 0) &&
              <div className='no-results-msg'>{noResultsFoundMsg}</div>
          }
        </Fragment>
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  mediaPlayerLoadNowPlayingItem: bindActionCreators(mediaPlayerLoadNowPlayingItem, dispatch),
  mediaPlayerUpdatePlaying: bindActionCreators(mediaPlayerUpdatePlaying, dispatch),
  pageIsLoading: bindActionCreators(pageIsLoading, dispatch),
  playerQueueLoadPriorityItems: bindActionCreators(playerQueueLoadPriorityItems, dispatch),
  userSetInfo: bindActionCreators(userSetInfo, dispatch)
})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(MediaListCtrl))
