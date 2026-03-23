const fs = require('fs');
const file = 'f:/MVP/test 4/tgt-contratto-mvp/apps/web/src/pages/CompanyProfilePage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix double submittingReview
content = content.replace(
  /const \[submittingReview, setSubmittingReview\] = useState\(false\);\n\s*const \[submittingReview, setSubmittingReview\] = useState\(false\);/g,
  'const [submittingReview, setSubmittingReview] = useState(false);'
);

const startIdx = content.indexOf('{/* Tabs */}');
const endIdx = content.indexOf('{/* Similar Companies */}');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + `{/* MAIN CONTENT START */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <div className="p-6 md:p-8">
                {/* 1. Serviços */}
                <div className="mb-14">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <LayoutGrid className="w-6 h-6 text-brand-primary" />
                    Serviços
                  </h3>
                  {company.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {company.services.map(service => (
                        <ServiceCard key={service.id} service={service} onRequestQuote={() => handleRequestQuote(service)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500">Nenhum serviço disponível.</p>
                    </div>
                  )}
                </div>

                {/* 2. Quem Somos */}
                <div className="mb-14">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Info className="w-6 h-6 text-brand-primary" />
                    Quem Somos
                  </h3>
                  <div className="space-y-8 bg-gray-50/50 rounded-2xl p-6 md:p-8 border border-gray-100">
                    <section>
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">Sobre a Empresa</h4>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{company.description || "Sem descrição."}</p>
                    </section>

                    {/* Languages & Skills */}
                    {(owner?.languages?.length || owner?.skills?.length) ? (
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200/80">
                        {owner?.languages && owner.languages.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Idiomas</h4>
                            <ul className="space-y-2">
                              {owner.languages.map((lang, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm text-gray-700 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                                  <span className="font-medium">{lang.language}</span>
                                  <span className="text-gray-500 text-xs font-semibold bg-gray-50 px-2 py-1 rounded-md">{lang.level}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {owner?.skills && owner.skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Competências</h4>
                            <div className="flex flex-wrap gap-2">
                              {owner.skills.map((skill, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg font-medium border border-gray-200 shadow-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </section>
                    ) : null}
                  </div>
                </div>

                {/* 3. Avaliações */}
                <div className="mb-14">
                  <div className="flex items-center gap-3 mb-8">
                    <Star className="w-6 h-6 text-brand-primary" />
                    <h3 className="font-display text-xl font-bold text-gray-900">
                      Avaliações
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {company.reviewCount || 0}
                    </span>
                  </div>
                  <ReviewsList reviews={company.reviews} overallRating={company.rating} reviewCount={company.reviewCount} />
                </div>

                {/* 4. Portfólio */}
                {company.portfolio.length > 0 && (
                  <div className="mb-14">
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <LayoutGrid className="w-6 h-6 text-brand-primary" />
                      Portfólio
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {company.portfolio.map((item, idx) => (
                        <div key={item.id || idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity shadow-sm border border-gray-200">
                          <OptimizedImage
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover relative z-0"
                            optimizedWidth={400}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Localização */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-6">
                    <MapPinIcon className="w-6 h-6 text-brand-primary" />
                    <h3 className="font-display text-xl font-bold text-gray-900">Localização</h3>
                  </div>

                  {company.address ? (
                    <div className="space-y-4">
                      <p className="text-base text-gray-700 bg-gray-50/80 p-5 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-medium">{company.address.street}, {company.address.number}</span> - {company.address.district}
                        <br />
                        <span className="text-gray-500 mt-1 block text-sm">{company.address.city}, {company.address.state} - CEP: {company.address.cep}</span>
                      </p>

                      <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                        {company.address.lat && company.address.lng ? (
                          <MapContainer
                            center={[company.address.lat, company.address.lng]}
                            zoom={15}
                            scrollWheelZoom={false}
                            className="h-full w-full"
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[company.address.lat, company.address.lng]}>
                              <Popup>
                                <div className="text-center font-semibold p-1">
                                  {company.companyName}
                                </div>
                              </Popup>
                            </Marker>
                          </MapContainer>
                        ) : (
                          <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <MapPinIcon className="w-10 h-10 opacity-20" />
                            <p className="text-sm font-medium">Geolocalização não disponível para este endereço.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">Endereço não informado pela empresa.</p>
                  )}
                </div>
              </div>
            </div>

            ` + content.substring(endIdx);
  
  fs.writeFileSync(file, content);
  console.log("SUCCESS");
} else {
  console.log("FAILED TO FIND INDICES", startIdx, endIdx);
}
