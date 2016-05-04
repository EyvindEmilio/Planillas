'use strict';

/**
 * @ngdoc function
 * @name planillasApp.controller:UsuariosCtrl
 * @description
 * # UsuariosCtrl
 * Controller of the planillasApp
 */
angular.module('planillasApp')
    .controller('UsuariosCtrl', function ($scope, $rootScope, $http2, $modal, $log, URLS, AuthService, ModelService, $q) {

        var promises = [
            $rootScope.GF.load_especialidades(),
            $rootScope.GF.load_unidades_academicas(),
            $rootScope.GF.load_tipo_usuarios(),
            AuthService.getUser()
        ];

        $scope.currentPage = 1;
        $scope.page_size = 10;

        $scope.filter_carrera = 0;
        $scope.filter_uuaa = 0;
        $scope.filter_tipo = 0;
        $scope.filter_nombre = "";

        $scope.changePage = function () {
            $scope.loadUsers({page: $scope.currentPage});
        };

        $scope.loadUsers = function (query_params) {
            var defer = $q.defer();
            query_params = query_params || {};
            query_params['is_complete_serializer'] = 1;
            query_params['page_size'] = $scope.page_size;

            if ($scope.filter_nombre != "")query_params['search'] = $scope.filter_nombre;
            if ($scope.filter_carrera != 0)query_params['especialidad'] = $scope.filter_carrera;
            if ($scope.filter_uuaa != 0)query_params['unidad_academica'] = $scope.filter_uuaa;
            if ($scope.filter_tipo != 0)query_params['tipo_usuario'] = $scope.filter_tipo;

            (new (new ModelService.UsuariosModel()).resource())
                .$get(query_params).then(function (data) {
                    defer.resolve(data);
                    $scope.user_data = data;
                }
                , function (data) {
                    defer.reject(data);
                });
            return defer.promise;
        };

        $q.all(promises)
            .then(function () {
                $scope.loadUsers();
            });

        $scope.openModalNewUsuario = function (usuario) {
            $rootScope.GF.load_tipo_usuarios(function () {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'views/modals/ModalNewUsuario.html',
                    controller: 'ModalNewUsuario',
                    size: 'md',
                    resolve: {
                        user: function () {
                            return usuario;
                        }
                    }
                });
                modalInstance.result.then(function (selectedItem) {
                    $scope.loadUsers();
                });
            });
        };

        $scope.eliminarUsuario = function (user) {
            $rootScope.openModalConfirm(function () {
                (new (new ModelService.UsuariosModel()).resource())
                    .$delete({id: user.id})
                    .then(function () {
                        $scope.currentPage = 1;
                        $scope.loadUsers();
                        toastr.success("Cuenta de usuario eliminada activada");
                    }, function () {
                        toastr.warning("Ha ocurrido un problema al realizar la acción");
                    });
            }, function () {
            }, "ELIMINAR USUARIO", "Seguro que desea eliminar usuario?");
        };

        $scope.alta_baja_usuario = function (user, act) {
            (new (new ModelService.UsuariosModel()).resource())
                .$update({id: user.id, activo: act})
                .then(function () {
                    if (act) {
                        toastr.success("Cuenta activada");
                    } else {
                        toastr.warning("Cuenta desactivada");
                    }
                    $scope.loadUsers();
                }, function () {
                    toastr.warning("Ha ocurrido un problema al realizar la acción");
                })
        };
    });
