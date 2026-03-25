/* eslint-disable @typescript-eslint/no-namespace */

/** Kakao Map SDK 및 Daum Postcode 서비스 전역 타입 선언 */

declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    setLevel(level: number): void
    getCenter(): LatLng
    getLevel(): number
    relayout(): void
  }

  interface MapOptions {
    center: LatLng
    level?: number
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    setPosition(position: LatLng): void
    getPosition(): LatLng
  }

  interface MarkerOptions {
    position: LatLng
    map?: Map
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
    setPosition(position: LatLng): void
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: string | HTMLElement
    map?: Map
    yAnchor?: number
    xAnchor?: number
    zIndex?: number
  }

  namespace services {
    type Status = "OK" | "ZERO_RESULT" | "ERROR"

    interface GeocoderResult {
      address: {
        address_name: string
        region_1depth_name: string
        region_2depth_name: string
        region_3depth_name: string
      }
      road_address: {
        address_name: string
        building_name: string
        zone_no: string
      } | null
    }

    interface AddressSearchResult {
      address_name: string
      x: string // longitude
      y: string // latitude
      address: {
        address_name: string
      }
      road_address: {
        address_name: string
        building_name: string
        zone_no: string
      } | null
    }

    class Geocoder {
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: GeocoderResult[], status: Status) => void
      ): void
      addressSearch(
        address: string,
        callback: (result: AddressSearchResult[], status: Status) => void
      ): void
    }
  }

  function load(callback: () => void): void
}

declare namespace daum {
  interface PostcodeData {
    zonecode: string
    address: string
    addressEnglish: string
    roadAddress: string
    roadAddressEnglish: string
    jibunAddress: string
    jibunAddressEnglish: string
    autoRoadAddress: string
    autoJibunAddress: string
    buildingCode: string
    buildingName: string
    apartment: string
    sido: string
    sigungu: string
    bname: string
    bname1: string
    bname2: string
    roadname: string
    userSelectedType: "R" | "J"
  }

  class Postcode {
    constructor(options: { oncomplete: (data: PostcodeData) => void; onclose?: () => void })
    open(): void
    embed(element: HTMLElement): void
  }
}

interface Window {
  kakao: typeof kakao
  daum: typeof daum
}
