/** Kakao Map 좌표↔주소 변환 유틸리티 */

export interface PostcodeResult {
  roadAddress: string
  jibunAddress: string
  zonecode: string
  buildingName: string
  lat: number
  lng: number
}

/** 좌표 → 주소 변환 (도로명 우선, 지번 폴백) */
export function coordToAddress(lat: number, lng: number): Promise<string> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 사용 가능"))
  }

  return new Promise((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status !== "OK" || result.length === 0) {
        reject(new Error("주소를 찾을 수 없습니다"))
        return
      }

      const item = result[0]
      const address = item.road_address?.address_name ?? item.address.address_name
      resolve(address)
    })
  })
}

/** 주소 → 좌표 변환 */
export function addressToCoord(address: string): Promise<{ lat: number; lng: number }> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 사용 가능"))
  }

  return new Promise((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(address, (result, status) => {
      if (status !== "OK" || result.length === 0) {
        reject(new Error("좌표를 찾을 수 없습니다"))
        return
      }

      resolve({
        lat: parseFloat(result[0].y),
        lng: parseFloat(result[0].x),
      })
    })
  })
}

/** 카카오 우편번호 팝업을 열고 주소 + 좌표를 반환 */
export function openPostcodePopup(): Promise<PostcodeResult> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 사용 가능"))
  }

  if (typeof daum === "undefined" || !daum.Postcode) {
    return Promise.reject(new Error("우편번호 서비스가 로드되지 않았습니다"))
  }

  return new Promise((resolve) => {
    new daum.Postcode({
      oncomplete: async (data) => {
        const address = data.roadAddress || data.jibunAddress

        // Kakao Map SDK로 좌표 변환 시도 (실패해도 주소만 반환)
        let lat = 0
        let lng = 0
        try {
          if (typeof kakao !== "undefined" && kakao.maps?.services) {
            const coord = await addressToCoord(address)
            lat = coord.lat
            lng = coord.lng
          }
        } catch (err) {
          console.warn("[Kakao] 좌표 변환 실패, 주소만 반환합니다:", err)
        }

        resolve({
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          zonecode: data.zonecode,
          buildingName: data.buildingName,
          lat,
          lng,
        })
      },
    }).open()
  })
}
