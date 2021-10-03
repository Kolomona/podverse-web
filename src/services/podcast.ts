import axios from 'axios'
import PV from '~/lib/constants'
import { convertObjectToQueryString } from '~/lib/utility'
import { request } from '~/services'
import config from '~/config'
const { API_BASE_URL } = config()

export const getPodcastsByQuery = async (query) => {
  const filteredQuery: any = {
    ...(query.maxResults ? { maxResults: true } : {})
  }

  if (query.sort) {
    filteredQuery.sort = query.sort
  } else {
    filteredQuery.sort = PV.queryParams.top_past_week
  }

  if (query.page) {
    filteredQuery.page = query.page
  } else {
    filteredQuery.page = 1
  }

  if (query.from === PV.queryParams.from_category) {
    filteredQuery.categories = query.categories
  } else if (query.from === PV.queryParams.subscribed_only) {
    filteredQuery.podcastId = Array.isArray(query.subscribedPodcastIds) && query.subscribedPodcastIds.length > 0
      ? query.subscribedPodcastIds : [PV.queryParams.no_results]
  } else {
    // from = all-podcasts
    // add nothing
  }

  if (query.searchBy === PV.queryParams.podcast) {
    filteredQuery.searchTitle = query.searchText ? encodeURIComponent(query.searchText) : ''
  } else if (query.searchBy === PV.queryParams.host) {
    filteredQuery.searchAuthor = query.searchText ? encodeURIComponent(query.searchText) : ''
  }

  const queryString = convertObjectToQueryString(filteredQuery)
  return axios(`${API_BASE_URL}${PV.paths.api.podcast}?${queryString}`, {
    method: 'get'
  })
}

export const getPodcastById = async (id: string) => {
  return request({
    endpoint: `${PV.paths.api.podcast}/${id}`
  })
}

export const toggleSubscribeToPodcast = async (podcastId: string) => {
  return axios(`${API_BASE_URL}${PV.paths.api.podcast}${PV.paths.api.toggle_subscribe}/${podcastId}`, {
    method: 'get',
    withCredentials: true
  })
}

export const handlePagePodcastsQuery = async (obj) => {
  const { categoryId, currentPage, pageIsLoading, pagesSetQueryState, podcastId,
    queryFrom, queryPage, queryRefresh, querySort, store } = obj

  if (Object.keys(currentPage).length === 0 || queryRefresh) {
    const queryDataResult = await getPodcastsByQuery({
      ...(categoryId ? { categories: categoryId } : {}),
      from: queryFrom,
      page: queryPage,
      sort: querySort,
      ...(queryFrom === PV.queryParams.subscribed_only ? { subscribedPodcastIds: podcastId } : {})
    })

    const podcasts = queryDataResult.data

    store.dispatch(pagesSetQueryState({
      pageKey: PV.pageKeys.podcasts,
      categoryId,
      listItems: podcasts[0],
      listItemsTotal: podcasts[1],
      queryPage,
      queryFrom,
      querySort,
      selected: queryFrom
    }))
  }

  store.dispatch(pageIsLoading(false))
}
